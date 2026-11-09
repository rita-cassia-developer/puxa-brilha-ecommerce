import "dotenv/config";
import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";

let connection;
try {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não está configurada neste terminal.");
  connection = await mysql.createConnection(process.env.DATABASE_URL);
  await connection.execute("SELECT id FROM users LIMIT 0");
  const migration = await readFile(new URL("../drizzle/0004_store_auth.sql", import.meta.url), "utf8");
  for (const statement of migration.split("--> statement-breakpoint").map(value => value.trim()).filter(Boolean)) {
    await connection.query(statement);
  }
  await connection.execute("SELECT userId, email, passwordHash, activationHash, activationExpiresAt, failedAttempts, lockedUntil FROM store_credentials LIMIT 0");
  await connection.execute("SELECT userId, tokenHash, expiresAt FROM store_sessions LIMIT 0");
  console.log("Tabelas de login prontas. Nenhum usuário, produto, pedido, parceiro ou ID de indicação foi removido ou alterado.");
} catch (error) {
  const code = error && typeof error === "object" && 'code' in error ? String(error.code) : "CONFIGURACAO";
  console.error(`Não foi possível habilitar o login (${code}). Confira a conexão, as permissões do banco e a existência da tabela users. Nenhum reset ou exclusão foi executado.`);
  process.exitCode = 1;
} finally { if (connection) await connection.end(); }
