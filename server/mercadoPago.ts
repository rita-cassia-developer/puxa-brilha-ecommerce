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

type PixPaymentData = { orderId: string | null; qrCode: string; qrCodeBase64: string; ticketUrl: string | null };

export async function createMercadoPagoPixOrder(input: { code: string; total: number; customerEmail?: string | null }): Promise<PixPaymentData | null> {
  const token = accessToken();
  if (!token) return null;
  const headers = { accept: "application/json", "content-type": "application/json", authorization: "Bearer " + token };
  const response = await fetch(MP_API + "/v1/orders", { method: "POST", headers: { ...headers, "x-idempotency-key": "puxa-pix-" + input.code }, body: JSON.stringify({ type: "online", processing_mode: "automatic", total_amount: input.total.toFixed(2), external_reference: input.code, transactions: { payments: [{ amount: input.total.toFixed(2), payment_method: { id: "pix", type: "bank_transfer" } }] }, payer: { email: input.customerEmail } }) });
  let data = await response.json().catch(() => ({})) as { id?: string; transactions?: { payments?: Array<{ payment_method?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string } }> }; message?: string; error?: string; cause?: Array<{ code?: string; description?: string }> };
  let method = data.transactions?.payments?.[0]?.payment_method;
  for (let attempt = 0; response.ok && !method?.qr_code && data.id && attempt < 4; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 700));
    const poll = await fetch(MP_API + "/v1/orders/" + encodeURIComponent(data.id), { headers });
    data = await poll.json().catch(() => data) as typeof data;
    method = data.transactions?.payments?.[0]?.payment_method;
  }
  const detail = data.cause?.map(item => item.description || item.code).filter(Boolean).join(" | ");
  if (!response.ok || !method?.qr_code || !method.qr_code_base64) throw new Error(data.message || data.error || detail || "O Mercado Pago não disponibilizou o QR Code Pix. Verifique se a chave Pix está cadastrada na conta.");
  return { orderId: data.id ?? null, qrCode: method.qr_code, qrCodeBase64: method.qr_code_base64, ticketUrl: method.ticket_url ?? null };
}

export async function getMercadoPagoPixPayment(orderId: string): Promise<PixPaymentData | null> {
  const token = accessToken();
  if (!token) return null;
  const response = await fetch(MP_API + "/v1/orders/" + encodeURIComponent(orderId), { headers: { accept: "application/json", authorization: "Bearer " + token } });
  const data = await response.json().catch(() => ({})) as { id?: string; transactions?: { payments?: Array<{ payment_method?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string } }> } };
  const method = data.transactions?.payments?.[0]?.payment_method;
  if (!response.ok || !method?.qr_code || !method.qr_code_base64) return null;
  return { orderId: data.id ?? orderId, qrCode: method.qr_code, qrCodeBase64: method.qr_code_base64, ticketUrl: method.ticket_url ?? null };
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
      "x-idempotency-key": `puxa-order-${input.code}`,
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
  const data = await response.json().catch(() => ({})) as { id?: string; checkout_url?: string; message?: string; error?: string };
  if (!response.ok || !data.checkout_url) throw new Error(data.message || data.error || "Não foi possível criar o checkout do Mercado Pago.");
  return { id: data.id || `mp-${input.code}`, checkoutUrl: data.checkout_url };
}

function confirmedPaymentMethod(remote: {
  transactions?: { payments?: Array<{ payment_method?: { type?: string; id?: string }; payment_method_id?: string }> };
}) {
  const payment = remote.transactions?.payments?.[0];
  const type = `${payment?.payment_method?.type ?? ""} ${payment?.payment_method?.id ?? ""} ${payment?.payment_method_id ?? ""}`.toLowerCase();
  if (type.includes("pix") || type.includes("bank_transfer")) return "pix" as const;
  if (type.includes("ticket") || type.includes("boleto")) return "boleto" as const;
  if (type.includes("card") || type.includes("credit") || type.includes("debit")) return "card" as const;
  return undefined;
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

export async function syncMercadoPagoOrder(orderId: string): Promise<{ paymentStatus: "pending" | "approved" | "rejected"; paymentMethod?: "pix" | "card" | "boleto" | "link" }> {
  const token = accessToken();
  if (!token) return { paymentStatus: "pending" };
  const response = await fetch(MP_API + "/v1/orders/" + encodeURIComponent(orderId), { headers: { accept: "application/json", authorization: "Bearer " + token } });
  if (!response.ok) return { paymentStatus: "pending" };
  const remote = await response.json() as { status?: string; status_detail?: string; transactions?: { payments?: Array<{ payment_method?: { type?: string; id?: string }; payment_method_id?: string }> } };
  const approved = remote.status === "processed" || remote.status_detail === "accredited";
  const rejected = remote.status === "cancelled" || remote.status === "failed";
  const paymentMethod = confirmedPaymentMethod(remote);
  return { paymentStatus: approved ? "approved" : rejected ? "rejected" : "pending", ...(paymentMethod ? { paymentMethod } : {}) };
}

export function registerMercadoPagoRoutes(app: Express) {
  app.post("/api/mercadopago/webhook", async (req, res) => {
    if (!validSignature(req)) return res.status(401).json({ error: "Assinatura inválida" });
    const token = accessToken();
    const orderId = String((req.body as { data?: { id?: string } })?.data?.id || req.query["data.id"] || "");
    if (!token || !orderId) return res.status(400).json({ error: "Notificação sem identificador do pedido" });
    try {
      const response = await fetch(`${MP_API}/v1/orders/${encodeURIComponent(orderId)}`, { headers: { authorization: `Bearer ${token}` } });
      if (!response.ok) return res.status(502).json({ error: "Não foi possível consultar o pedido no Mercado Pago" });
      const remote = await response.json() as { external_reference?: string; status?: string; status_detail?: string; transactions?: { payments?: Array<{ payment_method?: { type?: string; id?: string }; payment_method_id?: string }> } };
      if (!remote.external_reference) return res.status(422).json({ error: "Pedido sem referência externa" });
      const local = await getOrderByCode(remote.external_reference);
      if (!local) return res.status(404).json({ error: "Pedido local não encontrado" });
      const approved = remote.status === "processed" || remote.status_detail === "accredited";
      const rejected = remote.status === "cancelled" || remote.status === "failed";
      const paymentMethod = confirmedPaymentMethod(remote);
      if (approved) await updateOrderStatus(local.id, { ...(paymentMethod ? { paymentMethod } : {}), paymentStatus: "approved", orderStatus: "paid" });
      else if (rejected) await updateOrderStatus(local.id, { ...(paymentMethod ? { paymentMethod } : {}), paymentStatus: "rejected", orderStatus: "cancelled" });
      return res.sendStatus(200);
    } catch (error) {
      console.error("Mercado Pago webhook processing failed:", error instanceof Error ? error.message : error);
      return res.status(500).json({ error: "Falha ao processar a notificação" });
    }
  });
}
