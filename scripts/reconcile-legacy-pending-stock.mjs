import "dotenv/config";
import { URL } from "node:url";
import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada");

const url = new URL(process.env.DATABASE_URL);
const connection = await mysql.createConnection({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: decodeURIComponent(url.pathname.slice(1)),
});

try {
  await connection.beginTransaction();
  const [orders] = await connection.execute(
    `SELECT id, code FROM orders
     WHERE paymentStatus = 'pending' AND orderStatus = 'pending'
     ORDER BY id FOR UPDATE`,
  );
  const pendingOrders = orders;
  let restoredItems = 0;

  for (const order of pendingOrders) {
    const [items] = await connection.execute(
      `SELECT productId, quantity FROM order_items WHERE orderId = ?`,
      [order.id],
    );
    for (const item of items) {
      await connection.execute(
        `UPDATE products SET stock = stock + ? WHERE id = ?`,
        [item.quantity, item.productId],
      );
      restoredItems += item.quantity;
    }
    await connection.execute(
      `UPDATE orders SET orderStatus = 'cancelled' WHERE id = ? AND paymentStatus = 'pending' AND orderStatus = 'pending'`,
      [order.id],
    );
  }

  await connection.commit();
  console.log(`Pedidos pendentes cancelados: ${pendingOrders.length}`);
  console.log(`Unidades devolvidas ao estoque: ${restoredItems}`);
  console.log("Pedidos com pagamento aprovado não foram alterados.");
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
