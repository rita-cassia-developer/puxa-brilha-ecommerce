import { and, asc, desc, eq, inArray, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, commissions, leads, orderItems, orders, products, referralLinks, referralVisits, users, vendors } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existingByEmail = user.email ? await db.select().from(users).where(eq(users.email, user.email)).limit(1) : [];
  if (existingByEmail[0] && existingByEmail[0].openId !== user.openId && existingByEmail[0].role === "vendor" && !user.role) {
    await db.update(users).set({ openId: user.openId, name: user.name ?? existingByEmail[0].name, loginMethod: user.loginMethod ?? existingByEmail[0].loginMethod, lastSignedIn: user.lastSignedIn ?? new Date() }).where(eq(users.id, existingByEmail[0].id));
    return;
  }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function seedDummyVendors(productId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const seeds = [
    { openId: "dummy-vendor-ana", name: "Ana Souza (Teste)", email: "ana.teste@puxaebrilha.local", displayName: "Ana Souza (Vendedora teste)", publicCode: "TESTE-ANA", linkCode: "IND-ANA-TESTE" },
    { openId: "dummy-vendor-bruno", name: "Bruno Lima (Teste)", email: "bruno.teste@puxaebrilha.local", displayName: "Bruno Lima (Vendedor teste)", publicCode: "TESTE-BRUNO", linkCode: "IND-BRUNO-TESTE" },
    { openId: "dummy-vendor-carla", name: "Carla Mendes (Teste)", email: "carla.teste@puxaebrilha.local", displayName: "Carla Mendes (Vendedora teste)", publicCode: "TESTE-CARLA", linkCode: "IND-CARLA-TESTE" },
  ];
  const result: Array<{ displayName: string; publicCode: string; linkCode: string }> = [];
  for (const seed of seeds) {
    await db.insert(users).values({ openId: seed.openId, name: seed.name, email: seed.email, loginMethod: "dummy", role: "vendor" }).onDuplicateKeyUpdate({ set: { name: seed.name, email: seed.email, role: "vendor" } });
    const user = await db.select({ id: users.id }).from(users).where(eq(users.openId, seed.openId)).limit(1);
    if (!user[0]) continue;
    await db.insert(vendors).values({ userId: user[0].id, publicCode: seed.publicCode, displayName: seed.displayName, partnerType: "vendor", commissionType: "percentage", commissionValue: "5.00", status: "active" }).onDuplicateKeyUpdate({ set: { displayName: seed.displayName, partnerType: "vendor", status: "active" } });
    const vendor = await db.select({ id: vendors.id }).from(vendors).where(eq(vendors.publicCode, seed.publicCode)).limit(1);
    if (!vendor[0]) continue;
    await db.insert(referralLinks).values({ vendorId: vendor[0].id, code: seed.linkCode, productId: productId ?? null, status: "active" }).onDuplicateKeyUpdate({ set: { status: "active", productId: productId ?? null } });
    result.push({ displayName: seed.displayName, publicCode: seed.publicCode, linkCode: seed.linkCode });
  }
  return result;
}

export async function registerReferralVisit(input: { code: string; sessionId: string; productId?: number; landingPath?: string; userAgent?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const link = await db.select().from(referralLinks).where(and(eq(referralLinks.code, input.code), eq(referralLinks.status, "active"))).limit(1);
  if (!link[0]) return { tracked: false as const };
  const vendorId = link[0].vendorId;
  await db.insert(referralVisits).values({ vendorId, referralLinkId: link[0].id, sessionId: input.sessionId, productId: input.productId ?? link[0].productId ?? null, landingPath: input.landingPath ?? "/", userAgent: input.userAgent ?? null });
  const existingLead = await db.select({ id: leads.id }).from(leads).where(and(eq(leads.vendorId, vendorId), eq(leads.sessionId, input.sessionId))).limit(1);
  if (!existingLead[0]) await db.insert(leads).values({ vendorId, sessionId: input.sessionId, source: input.code, status: "new" });
  const vendor = await db.select({ displayName: vendors.displayName, publicCode: vendors.publicCode }).from(vendors).where(eq(vendors.id, vendorId)).limit(1);
  return { tracked: true as const, vendor: vendor[0] ?? null, code: input.code };
}

export type ProductRecord = typeof products.$inferSelect;
export type ProductInsert = typeof products.$inferInsert;

export async function listProducts(search?: string, activeOnly = false) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const where = search?.trim()
    ? activeOnly ? and(eq(products.status, "active"), like(products.name, `%${search.trim()}%`)) : like(products.name, `%${search.trim()}%`)
    : activeOnly ? eq(products.status, "active") : undefined;
  return db.select().from(products).where(where).orderBy(asc(products.createdAt));
}

export async function createProduct(input: ProductInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(products).values(input);
  const id = Number(result[0].insertId);
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return rows[0];
}

export async function updateProduct(id: number, input: Partial<ProductInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(products).set(input).where(eq(products.id, id));
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return rows[0];
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(products).where(eq(products.id, id));
  return { id };
}

export async function seedInitialProduct() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select({ id: products.id }).from(products).where(eq(products.slug, "puxa-e-brilha-cera-de-morango")).limit(1);
  if (existing.length > 0) return existing[0].id;
  const result = await db.insert(products).values({
    name: "Puxa & Brilha — Cera de Morango",
    slug: "puxa-e-brilha-cera-de-morango",
    category: "Wax",
    description: "Cera de morango que deixa a pele lisa e brilhosa, ideal para clínicas e profissionais de beleza.",
    price: "0.00",
    stock: 0,
    weightGrams: 1400,
    status: "draft",
  });
  return Number(result[0].insertId);
}

type CreateOrderInput = {
  items: Array<{ productId: number; quantity: number }>;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  address?: Record<string, string>;
  cep?: string;
  paymentMethod: "pix" | "card" | "boleto" | "link";
  fulfillment: "delivery" | "pickup";
  referralCode?: string;
};

function shippingForCep(cep: string) {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) throw new Error("CEP inválido");
  const prefix = Number(digits.slice(0, 2));
  if (prefix <= 19) return 12.9;
  if (prefix <= 49) return 18.9;
  if (prefix <= 79) return 24.9;
  return 29.9;
}

export async function createOrder(input: CreateOrderInput, customerUserId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (!input.items.length) throw new Error("O carrinho está vazio");
  const productIds = input.items.map(item => item.productId);
  const catalog = await db.select().from(products).where(inArray(products.id, productIds));
  const byId = new Map(catalog.map(product => [product.id, product]));
  const lines = input.items.map(item => {
    const product = byId.get(item.productId);
    if (!product || product.status !== "active") throw new Error("Produto indisponível");
    if (!Number.isInteger(item.quantity) || item.quantity < 1) throw new Error("Quantidade inválida");
    if (item.quantity > product.stock && product.stock > 0) throw new Error(`Estoque insuficiente para ${product.name}`);
    return { product, quantity: item.quantity, unitPrice: Number(product.price) };
  });
  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const shipping = input.fulfillment === "pickup" ? 0 : shippingForCep(input.cep ?? "");
  const total = subtotal + shipping;
  const referral = input.referralCode ? await db.select({ vendorId: referralLinks.vendorId, code: referralLinks.code }).from(referralLinks).where(and(eq(referralLinks.code, input.referralCode), eq(referralLinks.status, "active"))).limit(1) : [];
  const code = `PB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const result = await db.transaction(async tx => {
    const inserted = await tx.insert(orders).values({
      code, subtotal: subtotal.toFixed(2), shipping: shipping.toFixed(2), total: total.toFixed(2),
      paymentMethod: input.paymentMethod, fulfillment: input.fulfillment, customerName: input.customerName.trim(),
      customerEmail: input.customerEmail?.trim() || null, customerPhone: input.customerPhone?.trim() || null,
      addressJson: input.address ? JSON.stringify(input.address) : null,
      customerUserId: customerUserId ?? null, vendorId: referral[0]?.vendorId ?? null, referralCode: referral[0]?.code ?? null,
    });
    const orderId = Number(inserted[0].insertId);
    await tx.insert(orderItems).values(lines.map(line => ({ orderId, productId: line.product.id, productName: line.product.name, quantity: line.quantity, unitPrice: line.unitPrice.toFixed(2) })));
    if (referral[0] && subtotal > 0) {
      const vendor = await tx.select({ commissionType: vendors.commissionType, commissionValue: vendors.commissionValue }).from(vendors).where(eq(vendors.id, referral[0].vendorId)).limit(1);
      if (vendor[0]) {
        const rate = Number(vendor[0].commissionValue);
        const amount = vendor[0].commissionType === "fixed" ? rate : subtotal * rate / 100;
        await tx.insert(commissions).values({ vendorId: referral[0].vendorId, orderId, amount: amount.toFixed(2), status: "pending" });
      }
    }
    return orderId;
  });
  return { id: result, code, subtotal, shipping, total };
}

export async function listOrders() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(orders).orderBy(desc(orders.createdAt)).limit(100);
}

export async function listCustomerOrders(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const customerOrders = await db.select().from(orders).where(eq(orders.customerUserId, userId)).orderBy(desc(orders.createdAt)).limit(100);
  return Promise.all(customerOrders.map(async order => ({
    ...order,
    items: await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
  })));
}

export async function getOrderDetail(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const order = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order[0]) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  const vendor = order[0].vendorId
    ? await db.select({ displayName: vendors.displayName, publicCode: vendors.publicCode }).from(vendors).where(eq(vendors.id, order[0].vendorId)).limit(1)
    : [];
  return { order: order[0], items, vendor: vendor[0] ?? null };
}

export async function updateOrderStatus(id: number, input: { paymentStatus?: "pending" | "approved" | "rejected" | "refunded"; orderStatus?: "pending" | "paid" | "processing" | "shipped" | "ready_pickup" | "completed" | "cancelled" }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(orders).set(input).where(eq(orders.id, id));
  const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return rows[0];
}

export async function deleteOrder(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.transaction(async tx => {
    await tx.delete(commissions).where(eq(commissions.orderId, id));
    await tx.delete(orderItems).where(eq(orderItems.orderId, id));
    await tx.delete(orders).where(eq(orders.id, id));
  });
  return { id };
}

export async function listVendors() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(vendors).orderBy(asc(vendors.displayName));
  return Promise.all(rows.map(async vendor => {
    const link = await db.select({ code: referralLinks.code }).from(referralLinks).where(and(eq(referralLinks.vendorId, vendor.id), eq(referralLinks.status, "active"))).limit(1);
    return { ...vendor, referralCode: link[0]?.code ?? null };
  }));
}

export async function ensureReferralLink(vendorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const vendor = await db.select({ id: vendors.id, publicCode: vendors.publicCode }).from(vendors).where(eq(vendors.id, vendorId)).limit(1);
  if (!vendor[0]) throw new Error("Parceiro não encontrado");
  const existing = await db.select({ code: referralLinks.code }).from(referralLinks).where(and(eq(referralLinks.vendorId, vendorId), eq(referralLinks.status, "active"))).limit(1);
  if (existing[0]) return existing[0];
  const code = `IND-${vendor[0].publicCode}-${Date.now().toString(36).toUpperCase().slice(-4)}`.slice(0, 32);
  await db.insert(referralLinks).values({ vendorId, code, status: "active" });
  return { code };
}

export async function ensureOwnReferralLink(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const vendor = await db.select({ id: vendors.id }).from(vendors).where(eq(vendors.userId, userId)).limit(1);
  if (!vendor[0]) throw new Error("Perfil de parceiro não encontrado");
  return ensureReferralLink(vendor[0].id);
}

export async function createManualVendor(input: { displayName: string; email?: string; phone?: string; partnerType: "representative" | "vendor" | "distributor"; commissionValue: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const cleanName = input.displayName.trim();
  const publicCode = `YF-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const linkCode = `IND-${publicCode}`;
  const userResult = await db.insert(users).values({ openId: `manual-vendor-${Date.now()}`, name: cleanName, email: input.email?.trim() || null, loginMethod: "manual", role: "vendor" });
  const userId = Number(userResult[0].insertId);
  const vendorResult = await db.insert(vendors).values({ userId, displayName: cleanName, publicCode, phone: input.phone?.trim() || null, partnerType: input.partnerType, commissionType: "percentage", commissionValue: input.commissionValue.toFixed(2), status: "active" });
  const vendorId = Number(vendorResult[0].insertId);
  await db.insert(referralLinks).values({ vendorId, code: linkCode, status: "active" });
  return { id: vendorId, displayName: cleanName, publicCode, linkCode };
}

export async function listLeads() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(leads).orderBy(desc(leads.createdAt)).limit(200);
}

export async function listCommissions() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(commissions).orderBy(desc(commissions.createdAt)).limit(200);
}

export async function getVendorDashboard(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const vendor = await db.select().from(vendors).where(eq(vendors.userId, userId)).limit(1);
  if (!vendor[0]) return null;
  const [links, vendorLeads, vendorCommissions, vendorOrders] = await Promise.all([
    db.select().from(referralLinks).where(eq(referralLinks.vendorId, vendor[0].id)),
    db.select().from(leads).where(eq(leads.vendorId, vendor[0].id)).orderBy(desc(leads.createdAt)).limit(100),
    db.select().from(commissions).where(eq(commissions.vendorId, vendor[0].id)).orderBy(desc(commissions.createdAt)).limit(100),
    db.select().from(orders).where(eq(orders.vendorId, vendor[0].id)).orderBy(desc(orders.createdAt)).limit(100),
  ]);
  return { vendor: vendor[0], links, leads: vendorLeads, commissions: vendorCommissions, orders: vendorOrders };
}
