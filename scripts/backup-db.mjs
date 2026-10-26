import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { URL } from "node:url";
import { writeFile } from "node:fs/promises";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada");
const url = new URL(process.env.DATABASE_URL);
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
mkdirSync("backups", { recursive: true });
const output = `backups/puxa-e-brilha-${stamp}.sql`;
const args = ["--skip-lock-tables", "--no-tablespaces", "--routines", "--triggers", "--hex-blob", "-h", url.hostname, "-P", url.port || "3306", "-u", decodeURIComponent(url.username), url.pathname.slice(1)];
const result = spawnSync("mysqldump", args, { env: { ...process.env, MYSQL_PWD: decodeURIComponent(url.password) }, stdio: ["ignore", "pipe", "inherit"] });
if (result.status !== 0) process.exit(result.status ?? 1);
await writeFile(output, result.stdout);
console.log(`Backup criado em ${output}`);
