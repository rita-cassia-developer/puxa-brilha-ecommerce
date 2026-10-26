import "dotenv/config";
import { seedDummyVendors, seedInitialProduct } from "./db";

try {
  const id = await seedInitialProduct();
  console.log(`[Seed] Produto inicial disponível com id ${id}.`);
  const vendors = await seedDummyVendors(id);
  for (const vendor of vendors) console.log(`[Seed] ${vendor.displayName}: ?ref=${vendor.linkCode}`);
} catch (error) {
  console.error("[Seed] Falha ao preparar o catálogo:", error);
  process.exitCode = 1;
}
