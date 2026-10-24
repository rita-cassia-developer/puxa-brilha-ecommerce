import { decimal, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "manager", "vendor"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 220 }).notNull().unique(),
  category: varchar("category", { length: 80 }).notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  oldPrice: decimal("oldPrice", { precision: 10, scale: 2 }),
  stock: int("stock").default(0).notNull(),
  weightGrams: int("weightGrams").default(1400).notNull(),
  imageUrl: varchar("imageUrl", { length: 500 }),
  status: mysqlEnum("status", ["draft", "active", "archived"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ statusIdx: index("products_status_idx").on(table.status), categoryIdx: index("products_category_idx").on(table.category) }));

export const vendors = mysqlTable("vendors", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  publicCode: varchar("publicCode", { length: 32 }).notNull().unique(),
  displayName: varchar("displayName", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  commissionType: mysqlEnum("commissionType", ["percentage", "fixed"]).default("percentage").notNull(),
  commissionValue: decimal("commissionValue", { precision: 10, scale: 2 }).default("0").notNull(),
  status: mysqlEnum("status", ["pending", "active", "blocked"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ userIdx: index("vendors_user_idx").on(table.userId), statusIdx: index("vendors_status_idx").on(table.status) }));

export const referralLinks = mysqlTable("referral_links", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId").notNull().references(() => vendors.id),
  code: varchar("code", { length: 32 }).notNull().unique(),
  productId: int("productId").references(() => products.id),
  status: mysqlEnum("status", ["active", "disabled"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ vendorIdx: index("referral_links_vendor_idx").on(table.vendorId) }));

export const referralVisits = mysqlTable("referral_visits", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId").notNull().references(() => vendors.id),
  referralLinkId: int("referralLinkId").references(() => referralLinks.id),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  productId: int("productId").references(() => products.id),
  landingPath: varchar("landingPath", { length: 500 }),
  userAgent: varchar("userAgent", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ vendorIdx: index("referral_visits_vendor_idx").on(table.vendorId), sessionIdx: index("referral_visits_session_idx").on(table.sessionId) }));

export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId").references(() => vendors.id),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  name: varchar("name", { length: 160 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 40 }),
  source: varchar("source", { length: 120 }),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "converted", "lost"]).default("new").notNull(),
  consentAt: timestamp("consentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ vendorIdx: index("leads_vendor_idx").on(table.vendorId), statusIdx: index("leads_status_idx").on(table.status) }));

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  customerUserId: int("customerUserId").references(() => users.id),
  vendorId: int("vendorId").references(() => vendors.id),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  shipping: decimal("shipping", { precision: 10, scale: 2 }).default("0").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["pix", "card", "boleto", "link"]).notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "approved", "rejected", "refunded"]).default("pending").notNull(),
  orderStatus: mysqlEnum("orderStatus", ["pending", "paid", "processing", "shipped", "ready_pickup", "completed", "cancelled"]).default("pending").notNull(),
  fulfillment: mysqlEnum("fulfillment", ["delivery", "pickup"]).default("delivery").notNull(),
  customerName: varchar("customerName", { length: 160 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 40 }),
  addressJson: text("addressJson"),
  referralCode: varchar("referralCode", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ vendorIdx: index("orders_vendor_idx").on(table.vendorId), paymentIdx: index("orders_payment_idx").on(table.paymentStatus), createdIdx: index("orders_created_idx").on(table.createdAt) }));

export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => orders.id),
  productId: int("productId").notNull().references(() => products.id),
  productName: varchar("productName", { length: 180 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
}, table => ({ orderIdx: index("order_items_order_idx").on(table.orderId) }));

export const commissions = mysqlTable("commissions", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId").notNull().references(() => vendors.id),
  orderId: int("orderId").notNull().references(() => orders.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "paid", "cancelled"]).default("pending").notNull(),
  availableAt: timestamp("availableAt"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ vendorIdx: index("commissions_vendor_idx").on(table.vendorId), orderIdx: index("commissions_order_idx").on(table.orderId) }));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
