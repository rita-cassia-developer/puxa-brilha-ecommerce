import type { Express, Request, Response } from "express";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { storeCredentials } from "../drizzle/schema";
import { StoreAuthError, activateStoreAccount, isSameOrigin, limitAuthAttempt, localSessionToken, registerStoreCustomer, requireSameOrigin, signInStore } from "./storeAuth";

const email = z.string().trim().email().max(320);
const password = z.string().min(10, "Use uma senha com pelo menos 10 caracteres.").max(128, "A senha deve ter até 128 caracteres.");
const loginInput = z.object({ email, password: z.string().min(1).max(128) }).strict();
const registerInput = z.object({ name: z.string().trim().min(2).max(160), email, password }).strict();
const activateInput = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/), password }).strict();

export function localMutationOriginGuard(req: Request, res: Response, next: () => void) {
  if (req.method === "POST" && localSessionToken(req) && !isSameOrigin(req)) {
    res.status(403).json({ error: "Origem inválida." }); return;
  }
  next();
}
function handleError(error: unknown, res: Response) {
  if (error instanceof StoreAuthError) { res.status(error.status).json({ error: error.message }); return; }
  if (error instanceof z.ZodError) { res.status(400).json({ error: error.issues[0]?.message ?? "Confira os dados informados." }); return; }
  const code = (error as { code?: string; cause?: { code?: string } })?.code ?? (error as { cause?: { code?: string } })?.cause?.code;
  if (code === "ER_DUP_ENTRY") { res.status(409).json({ error: "Não foi possível cadastrar esse e-mail. Entre com sua conta ou solicite ajuda à loja." }); return; }
  // No database query, password, token or DSN is logged or returned.
  res.status(503).json({ error: "O acesso ainda precisa ser habilitado no banco da hospedagem ou está temporariamente indisponível. Avise a equipe da loja." });
}
export function registerStoreAuthRoutes(app: Express) {
  app.use("/api/store-auth", (_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
  app.get("/api/store-auth/status", async (_req, res) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("database unavailable");
      await db.select({ exists: sql`1` }).from(storeCredentials).limit(1);
      res.json({ ready: true });
    } catch { res.json({ ready: false, message: "A hospedagem precisa aplicar a atualização das tabelas de login. A loja continua disponível para compras sem login." }); }
  });
  app.post("/api/store-auth/login", async (req, res) => {
    try {
      requireSameOrigin(req);
      const input = loginInput.parse(req.body);
      limitAuthAttempt(req, input.email);
      res.json(await signInStore(input.email, input.password, req, res));
    } catch (error) { handleError(error, res); }
  });
  app.post("/api/store-auth/register", async (req, res) => {
    try {
      requireSameOrigin(req);
      const input = registerInput.parse(req.body);
      limitAuthAttempt(req, input.email);
      res.status(201).json(await registerStoreCustomer(input.name, input.email, input.password, req, res));
    } catch (error) { handleError(error, res); }
  });
  app.post("/api/store-auth/activate", async (req, res) => {
    try {
      requireSameOrigin(req);
      const input = activateInput.parse(req.body);
      limitAuthAttempt(req, `invitation:${input.token}`);
      res.json(await activateStoreAccount(input.token, input.password, req, res));
    } catch (error) { handleError(error, res); }
  });
}
