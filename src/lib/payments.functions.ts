import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// All providers use public sandbox/test environments. Secrets are read only inside handlers.
const input = z.object({
  amount: z.number().int().min(50).max(5_000_000),
  concept: z.string().trim().min(3).max(120),
  orderId: z.string().regex(/^[A-Za-z0-9-]{4,26}$/),
  origin: z.string().url().refine((u) => /^https:\/\/|^http:\/\/localhost(:\d+)?/.test(u), "origin inválido"),
});
type Out = { ok: true; url: string; token?: string; ref: string } | { ok: false; error: string };
const safe = async (fn: () => Promise<Out>): Promise<Out> => { try { return await fn(); } catch (e) { console.error(e); return { ok: false, error: "Error al contactar al proveedor" }; } };

export const TBK = {
  base: "https://webpay3gint.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions",
  // Official public integration credentials published by Transbank for testing.
  headers: () => ({ "Tbk-Api-Key-Id": process.env["TBK_COMMERCE_CODE"] ?? "597055555532", "Tbk-Api-Key-Secret": process.env["TBK_API_KEY"] ?? "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C", "Content-Type": "application/json" }),
};

export const payTransbank = createServerFn({ method: "POST" }).inputValidator((d: unknown) => input.parse(d)).handler(({ data }) => safe(async () => {
  const r = await fetch(TBK.base, { method: "POST", headers: TBK.headers(), body: JSON.stringify({ buy_order: data.orderId, session_id: `s-${data.orderId}`, amount: data.amount, return_url: `${data.origin}/api/public/transbank/return` }) });
  const j = await r.json() as { token?: string; url?: string; error_message?: string };
  if (!r.ok || !j.token) return { ok: false, error: j.error_message ?? `Transbank ${r.status}` };
  return { ok: true, url: j.url!, token: j.token, ref: data.orderId };
}));

export const payMercadoPago = createServerFn({ method: "POST" }).inputValidator((d: unknown) => input.parse(d)).handler(({ data }) => safe(async () => {
  const token = process.env["MP_ACCESS_TOKEN"];
  if (!token) return { ok: false, error: "Falta el secreto MP_ACCESS_TOKEN (credencial TEST- de Mercado Pago)" };
  const r = await fetch("https://api.mercadopago.com/checkout/preferences", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({
    items: [{ title: data.concept, quantity: 1, unit_price: data.amount, currency_id: "CLP" }], external_reference: data.orderId,
    back_urls: { success: `${data.origin}/pagos?status=aprobado&prov=mp&ref=${data.orderId}`, failure: `${data.origin}/pagos?status=rechazado&prov=mp&ref=${data.orderId}`, pending: `${data.origin}/pagos?status=pendiente&prov=mp&ref=${data.orderId}` },
  }) });
  const j = await r.json() as { sandbox_init_point?: string; init_point?: string; message?: string };
  const url = j.sandbox_init_point ?? j.init_point;
  return r.ok && url ? { ok: true, url, ref: data.orderId } : { ok: false, error: j.message ?? `Mercado Pago ${r.status}` };
}));

export const payPayPal = createServerFn({ method: "POST" }).inputValidator((d: unknown) => input.parse(d)).handler(({ data }) => safe(async () => {
  const id = process.env["PAYPAL_CLIENT_ID"], sec = process.env["PAYPAL_CLIENT_SECRET"];
  if (!id || !sec) return { ok: false, error: "Faltan los secretos PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET (app Sandbox)" };
  const base = "https://api-m.sandbox.paypal.com";
  const t = await fetch(`${base}/v1/oauth2/token`, { method: "POST", headers: { Authorization: `Basic ${btoa(`${id}:${sec}`)}`, "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" });
  const { access_token } = await t.json() as { access_token?: string };
  if (!access_token) return { ok: false, error: "Credenciales PayPal inválidas" };
  const usd = Math.max(1, data.amount / 950).toFixed(2); // CLP no soportado: conversión aproximada a USD
  const r = await fetch(`${base}/v2/checkout/orders`, { method: "POST", headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({
    intent: "CAPTURE", purchase_units: [{ reference_id: data.orderId, description: data.concept, amount: { currency_code: "USD", value: usd } }],
    application_context: { return_url: `${data.origin}/pagos?status=aprobado&prov=paypal&ref=${data.orderId}`, cancel_url: `${data.origin}/pagos?status=rechazado&prov=paypal&ref=${data.orderId}` },
  }) });
  const j = await r.json() as { links?: { rel: string; href: string }[] };
  const url = j.links?.find((l) => l.rel === "approve")?.href;
  return url ? { ok: true, url, ref: data.orderId } : { ok: false, error: `PayPal ${r.status}` };
}));

export const payCrypto = createServerFn({ method: "POST" }).inputValidator((d: unknown) => input.parse(d)).handler(({ data }) => safe(async () => {
  const key = process.env["NOWPAYMENTS_API_KEY"];
  if (!key) return { ok: false, error: "Falta el secreto NOWPAYMENTS_API_KEY (cuenta sandbox de NOWPayments)" };
  const r = await fetch("https://api-sandbox.nowpayments.io/v1/invoice", { method: "POST", headers: { "x-api-key": key, "Content-Type": "application/json" }, body: JSON.stringify({
    price_amount: Math.max(1, data.amount / 950).toFixed(2), price_currency: "usd", order_id: data.orderId, order_description: data.concept,
    success_url: `${data.origin}/pagos?status=aprobado&prov=crypto&ref=${data.orderId}`, cancel_url: `${data.origin}/pagos?status=rechazado&prov=crypto&ref=${data.orderId}`,
  }) });
  const j = await r.json() as { invoice_url?: string; message?: string };
  return j.invoice_url ? { ok: true, url: j.invoice_url, ref: data.orderId } : { ok: false, error: j.message ?? `NOWPayments ${r.status}` };
}));
