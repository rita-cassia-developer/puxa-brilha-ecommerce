import "dotenv/config";
import { seedInitialProduct } from "./db";

try {
  const id = await seedInitialProduct();
  console.log(`[Seed] Produto inicial disponível com id ${id}.`);
} catch (error) {
  console.error("[Seed] Falha ao preparar o catálogo:", error);
  process.exitCode = 1;
}
