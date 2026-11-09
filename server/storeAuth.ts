import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { and, eq, gt, sql } from "drizzle-orm";
import { parse as parseCookies } from "cookie";
import type { Request, Response } from "express";
import { storeCredentials, storeSessions, users, vendors, type User } from "../drizzle/schema";
import { getDb } from "./db";
import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";

const derive = promisify(scrypt);
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;
export class StoreAuthError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const digestToken = (token: string) => createHash("sha256").update(token).digest("hex");
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = await derive(password, salt, 64) as Buffer;
  return `scrypt:${salt}:${key.toString("hex")}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [algorithm, salt, hash] = stored.split(":");
  if (algorithm !== "scrypt" || !/^[a-f0-9]{32}$/.test(salt ?? "") || !/^[a-f0-9]{128}$/.test(hash ?? "")) return false;
  const key = await derive(password, salt, 64) as Buffer;
  return timingSafeEqual(key, Buffer.from(hash, "hex"));
}
let dummyPassword: Promise<string> | undefined;
const unavailable = () => new StoreAuthError(503, "O login ainda precisa ser habilitado no banco da hospedagem. Avise a equipe da loja.");
async function database() { const db = await getDb(); if (!db) throw unavailable(); return db; }

export function localSessionToken(req: Request): string | undefined {
  const token = parseCookies(req.headers.cookie ?? "")[COOKIE_NAME];
  return token?.startsWith("pb_") ? token : undefined;
}
export async function readLocalUser(req: Request): Promise<User | null> {
  const token = localSessionToken(req);
  if (!token || !/^pb_[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const db = await database();
  const rows = await db.select({ user: users }).from(storeSessions).innerJoin(users, eq(users.id, storeSessions.userId))
    .where(and(eq(storeSessions.tokenHash, digestToken(token)), gt(storeSessions.expiresAt, new Date()))).limit(1);
  const user = rows[0]?.user;
  if (user?.role === "vendor") {
    const partner = await db.select({ status: vendors.status }).from(vendors).where(eq(vendors.userId, user.id)).limit(1);
    if (!partner[0] || partner[0].status !== "active") return null;
  }
  return user ?? null;
}
export async function revokeLocalSession(req: Request) {
  const token = localSessionToken(req);
  if (!token) return;
  const db = await database();
  await db.delete(storeSessions).where(eq(storeSessions.tokenHash, digestToken(token)));
}
export function isSameOrigin(req: Request) {
  const origin = req.get("origin");
  if (!origin) return false;
  try {
    const url = new URL(origin);
    const configured = process.env.PUBLIC_APP_URL;
    if (configured) return url.origin === new URL(configured).origin;
    return (url.protocol === "https:" || url.hostname === "localhost" || url.hostname === "127.0.0.1") && url.host === req.get("host");
  } catch { return false; }
}
export function requireSameOrigin(req: Request) {
  if (!isSameOrigin(req)) throw new StoreAuthError(403, "Requisição de acesso inválida. Abra a loja novamente e tente de novo.");
}
const attempts = new Map<string, { count: number; expires: number }>();
export function limitAuthAttempt(req: Request, email: string) {
  const now = Date.now();
  for (const [key, row] of attempts) if (row.expires <= now) attempts.delete(key);
  if (attempts.size > 10000) throw new StoreAuthError(429, "Muitas tentativas. Tente novamente em alguns minutos.");
  for (const [key, max] of [[`email:${digestToken(normalizeEmail(email))}`, 12], [`ip:${req.socket.remoteAddress ?? "unknown"}`, 150]] as const) {
    const row = attempts.get(key) ?? { count: 0, expires: now + 15 * 60 * 1000 };
    row.count++; attempts.set(key, row);
    if (row.count > max) throw new StoreAuthError(429, "Muitas tentativas. Tente novamente em 15 minutos.");
  }
}
async function issueSession(user: User, req: Request, res: Response) {
  const db = await database();
  const token = `pb_${randomBytes(32).toString("base64url")}`;
  // Only the digest is stored. The bearer token never appears in JSON or logs.
  await db.insert(storeSessions).values({ userId: user.id, tokenHash: digestToken(token), expiresAt: new Date(Date.now() + SESSION_MS) });
  res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(req), maxAge: SESSION_MS });
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
  return { success: true, destination: user.role === "admin" || user.role === "manager" ? "/admin" : user.role === "vendor" ? "/vendedor" : "/cliente" };
}
export async function signInStore(email: string, password: string, req: Request, res: Response) {
  const db = await database();
  const rows = await db.select({ credential: storeCredentials, user: users }).from(storeCredentials)
    .innerJoin(users, eq(users.id, storeCredentials.userId)).where(eq(storeCredentials.email, normalizeEmail(email))).limit(1);
  const row = rows[0];
  dummyPassword ??= hashPassword(randomBytes(32).toString("hex"));
  const valid = await verifyPassword(password, row?.credential.passwordHash ?? await dummyPassword);
  if (!row || !row.credential.passwordHash || !valid || (row.credential.lockedUntil && row.credential.lockedUntil > new Date())) {
    const expiredLock = Boolean(row?.credential.lockedUntil && row.credential.lockedUntil <= new Date());
    if (row && (!row.credential.lockedUntil || expiredLock)) await db.update(storeCredentials).set({
      lockedUntil: expiredLock ? null : sql`CASE WHEN ${storeCredentials.failedAttempts} >= 4 THEN DATE_ADD(NOW(), INTERVAL 15 MINUTE) ELSE NULL END`,
      failedAttempts: expiredLock ? 1 : sql`${storeCredentials.failedAttempts} + 1`,
    }).where(eq(storeCredentials.id, row.credential.id));
    throw new StoreAuthError(401, "Não foi possível entrar. Confira e-mail e senha ou aguarde 15 minutos após várias tentativas.");
  }
  if (row.user.role === "vendor") {
    const partner = await db.select({ status: vendors.status }).from(vendors).where(eq(vendors.userId, row.user.id)).limit(1);
    if (!partner[0] || partner[0].status !== "active") throw new StoreAuthError(403, "Seu acesso profissional precisa ser liberado pela administração.");
  }
  await db.update(storeCredentials).set({ failedAttempts: 0, lockedUntil: null }).where(eq(storeCredentials.id, row.credential.id));
  return issueSession(row.user, req, res);
}
export async function registerStoreCustomer(name: string, email: string, password: string, req: Request, res: Response) {
  const db = await database();
  const normalized = normalizeEmail(email);
  const passwordHash = await hashPassword(password);
  const user = await db.transaction(async tx => {
    const existing = await tx.select({ id: users.id }).from(users).where(sql`LOWER(TRIM(${users.email})) = ${normalized}`).limit(1);
    if (existing[0]) throw new StoreAuthError(409, "Não foi possível cadastrar esse e-mail. Entre com sua conta ou peça à loja a ativação do acesso existente.");
    const inserted = await tx.insert(users).values({ openId: `local_${randomUUID()}`, name: name.trim(), email: normalized, role: "user", loginMethod: "store-password" });
    const userId = Number(inserted[0].insertId);
    await tx.insert(storeCredentials).values({ userId, email: normalized, passwordHash });
    const rows = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
    return rows[0];
  });
  return issueSession(user, req, res);
}
export async function createPartnerInvitation(vendorId: number) {
  const db = await database();
  const rows = await db.select({ user: users }).from(vendors).innerJoin(users, eq(users.id, vendors.userId)).where(eq(vendors.id, vendorId)).limit(1);
  const user = rows[0]?.user;
  if (!user?.email || user.role !== "vendor") throw new StoreAuthError(400, "O parceiro precisa ter um e-mail e perfil válido cadastrados.");
  return createUserInvitation(user);
}
export async function createUserInvitation(user: User) {
  const db = await database();
  if (!user.email) throw new StoreAuthError(400, "Este cadastro não tem e-mail.");
  const email = normalizeEmail(user.email);
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db.transaction(async tx => {
    const existing = await tx.select().from(storeCredentials).where(eq(storeCredentials.userId, user.id)).for("update");
    if (existing[0]?.passwordHash) throw new StoreAuthError(409, "Este acesso já está ativado. A senha existente não foi alterada.");
    const values = { activationHash: digestToken(token), activationExpiresAt: expires };
    if (existing[0]) await tx.update(storeCredentials).set(values).where(eq(storeCredentials.userId, user.id));
    else await tx.insert(storeCredentials).values({ userId: user.id, email, ...values });
  });
  return { token, expiresAt: expires.toISOString() };
}
export async function activateStoreAccount(token: string, password: string, req: Request, res: Response) {
  const db = await database();
  const hash = await hashPassword(password);
  const user = await db.transaction(async tx => {
    const rows = await tx.select().from(storeCredentials).where(and(eq(storeCredentials.activationHash, digestToken(token)), gt(storeCredentials.activationExpiresAt, new Date()))).for("update");
    const credential = rows[0];
    if (!credential || credential.passwordHash) throw new StoreAuthError(400, "O convite é inválido ou expirou. Peça um novo convite à administração.");
    await tx.update(storeCredentials).set({ passwordHash: hash, activationHash: null, activationExpiresAt: null, failedAttempts: 0, lockedUntil: null }).where(eq(storeCredentials.id, credential.id));
    const userRows = await tx.select().from(users).where(eq(users.id, credential.userId)).limit(1);
    return userRows[0];
  });
  return issueSession(user, req, res);
}
