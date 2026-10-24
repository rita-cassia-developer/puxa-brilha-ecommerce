import { and, asc, desc, eq, inArray, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, orderItems, orders, products, users } from "../drizzle/schema";
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
  const existing = await db.select({ id: products.id }).from(products).where(eq(products.slug, "yaffa-cera-de-morango")).limit(1);
  if (existing.length > 0) return existing[0].id;
  const result = await db.insert(products).values({
    name: "Yaffa — Cera de Morango",
    slug: "yaffa-cera-de-morango",
    category: "Wax",
    description: "Cera depilatória profissional com aroma de morango, ideal para clínicas de depilação e depiladoras profissionais.",
    price: "0.00",
    stock: 0,
    weightGrams: 1400,
    status: "active",
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

export async function createOrder(input: CreateOrderInput) {
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
  const code = `YF-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const result = await db.transaction(async tx => {
    const inserted = await tx.insert(orders).values({
      code, subtotal: subtotal.toFixed(2), shipping: shipping.toFixed(2), total: total.toFixed(2),
      paymentMethod: input.paymentMethod, fulfillment: input.fulfillment, customerName: input.customerName.trim(),
      customerEmail: input.customerEmail?.trim() || null, customerPhone: input.customerPhone?.trim() || null,
      addressJson: input.address ? JSON.stringify(input.address) : null,
    });
    const orderId = Number(inserted[0].insertId);
    await tx.insert(orderItems).values(lines.map(line => ({ orderId, productId: line.product.id, productName: line.product.name, quantity: line.quantity, unitPrice: line.unitPrice.toFixed(2) })));
    return orderId;
  });
  return { id: result, code, subtotal, shipping, total };
}

export async function listOrders() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(orders).orderBy(desc(orders.createdAt)).limit(100);
}
