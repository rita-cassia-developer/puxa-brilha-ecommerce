import { and, asc, eq, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, products, users } from "../drizzle/schema";
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
