import crypto from "node:crypto";
import type { Express, Request } from "express";
import { getOrderByCode, updateOrderStatus } from "./db";

const MP_API = "https://api.mercadopago.com";

function accessToken() {
  return process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() || "";
}

function publicOrigin() {
  return (process.env.PUBLIC_APP_URL || "").trim().replace(/\/$/, "");
}

export async function createMercadoPagoOrder(input: {
  code: string;
  total: number;
  shipping: number;
  customerEmail?: string | null;
  items: Array<{ productName: string; quantity: number; unitPrice: string | number }>;
}) {
  const token = accessToken();
  if (!token) return null;
  const response = await fetch(`${MP_API}/v1/orders`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      "x-idempotency-key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      type: "online",
      processing_mode: "manual",
      capture_mode: "automatic_async",
      total_amount: input.total.toFixed(2),
      external_reference: input.code,
      ...(input.customerEmail ? { payer: { email: input.customerEmail } } : {}),
      items: [
        ...input.items.map(item => ({ title: item.productName, quantity: item.quantity, unit_price: Number(item.unitPrice).toFixed(2) })),
        ...(input.shipping > 0 ? [{ title: "Frete", quantity: 1, unit_price: input.shipping.toFixed(2) }] : []),
      ],
      ...(publicOrigin() ? { config: { online: {
        success_url: `${publicOrigin()}/?pagamento=sucesso`,
        failure_url: `${publicOrigin()}/?pagamento=falhou`,
        pending_url: `${publicOrigin()}/?pagamento=pendente`,
        auto_return: "approved",
      } } } : {}),
    }),
  });
  const data = await response.json().catch(() => ({})) as { checkout_url?: string; message?: string; error?: string };
  if (!response.ok || !data.checkout_url) throw new Error(data.message || data.error || "Não foi possível criar o checkout do Mercado Pago.");
  return data.checkout_url;
}

function validSignature(req: Request) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  const signature = req.header("x-signature") || "";
  const requestId = req.header("x-request-id") || "";
  const dataId = String((req.query["data.id"] || (req.body as { data?: { id?: string } })?.data?.id || "")).toLowerCase();
  const ts = signature.match(/ts=([^,]+)/)?.[1] || "";
  const v1 = signature.match(/v1=([^,]+)/)?.[1] || "";
  if (!ts || !v1 || !requestId || !dataId) return false;
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  return v1.length === expected.length && crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
}

export function registerMercadoPagoRoutes(app: Express) {
  app.post("/api/mercadopago/webhook", async (req, res) => {
    if (!validSignature(req)) return res.status(401).json({ error: "Assinatura inválida" });
    res.sendStatus(200);
    const token = accessToken();
    const orderId = String((req.body as { data?: { id?: string } })?.data?.id || req.query["data.id"] || "");
    if (!token || !orderId) return;
    try {
      const response = await fetch(`${MP_API}/v1/orders/${encodeURIComponent(orderId)}`, { headers: { authorization: `Bearer ${token}` } });
      if (!response.ok) return;
      const remote = await response.json() as { external_reference?: string; status?: string; status_detail?: string };
      if (!remote.external_reference) return;
      const local = await getOrderByCode(remote.external_reference);
      if (!local) return;
      const approved = remote.status === "processed" || remote.status_detail === "accredited";
      const rejected = remote.status === "cancelled" || remote.status === "failed";
      if (approved) await updateOrderStatus(local.id, { paymentStatus: "approved", orderStatus: "paid" });
      else if (rejected) await updateOrderStatus(local.id, { paymentStatus: "rejected", orderStatus: "cancelled" });
    } catch (error) {
      console.error("Mercado Pago webhook processing failed:", error instanceof Error ? error.message : error);
    }
  });
}
