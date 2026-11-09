import "dotenv/config";
import mysql from "mysql2/promise";
import { createHash, randomBytes } from "node:crypto";
import { createInterface } from "node:readline/promises";

// Execute only on the production server by its authorized administrator.
// It activates an EXISTING administrator and never creates/promotes users.
const rl = createInterface({ input: process.stdin, output: process.stdout });
let connection;
try {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não foi configurada neste terminal.");
  const email = (await rl.question("E-mail do administrador JÁ cadastrado: ")).trim().toLowerCase();
  const originInput = (await rl.question("Endereço HTTPS da loja: ")).trim();
  const origin = new URL(originInput);
  if (origin.protocol !== "https:" || origin.username || origin.password) throw new Error("Use o endereço HTTPS da loja, sem credenciais.");
  connection = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await connection.execute("SELECT id, role, email FROM users WHERE LOWER(TRIM(email)) = ?", [email]);
  if (rows.length !== 1 || rows[0].role !== "admin") throw new Error("Não foi encontrado um único administrador com esse e-mail. Nenhum cadastro foi criado ou alterado. Verifique o cadastro administrativo antes de continuar.");
  const userId = rows[0].id;
  await connection.beginTransaction();
  const [credentials] = await connection.execute("SELECT id, passwordHash FROM store_credentials WHERE userId = ? FOR UPDATE", [userId]);
  if (credentials[0]?.passwordHash) throw new Error("Este administrador já tem senha. A senha não foi modificada.");
  const answer = (await rl.question("Gerar convite privado para esse cadastro existente, sem mudar seu perfil ou ID? Digite SIM: ")).trim();
  if (answer !== "SIM") { await connection.rollback(); throw new Error("Cancelado. Nenhum cadastro foi alterado."); }
  const token = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(token).digest("hex");
  if (credentials[0]) await connection.execute("UPDATE store_credentials SET activationHash = ?, activationExpiresAt = DATE_ADD(NOW(), INTERVAL 24 HOUR) WHERE userId = ?", [hash, userId]);
  else await connection.execute("INSERT INTO store_credentials (userId,email,activationHash,activationExpiresAt) VALUES (?,?,?,DATE_ADD(NOW(), INTERVAL 24 HOUR))", [userId, email, hash]);
  await connection.commit();
  const url = new URL("/cliente", origin.origin); url.searchParams.set("convite", token);
  console.log("\nConvite PRIVADO, válido por 24 horas e utilizável uma única vez:");
  console.log(url.toString());
  console.log("Abra o link para definir a senha. Não envie esse link no chat, nos logs ou no GitHub.");
} catch (error) {
  if (connection) await connection.rollback().catch(() => {});
  const safe = error instanceof Error && !('sql' in error) ? error.message : "Falha no banco. Confirme as tabelas e o cadastro existente. Nenhum usuário foi criado ou promovido.";
  console.error(safe); process.exitCode = 1;
} finally { rl.close(); if (connection) await connection.end(); }
