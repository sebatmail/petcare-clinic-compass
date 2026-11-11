import { createFileRoute } from "@tanstack/react-router";
import { TBK } from "@/lib/payments.functions";

// Webpay return URL: confirms (commits) the transaction server-side, never trusting the browser.
async function handle(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host;
  const proto = request.headers.get("x-forwarded-proto") || "http";
  const origin = `${proto}://${host}`;
  let params = url.searchParams;
  if (request.method === "POST") params = new URLSearchParams(await request.text());
  const token = params.get("token_ws");
  const go = (q: string) => Response.redirect(`${origin}/pagos?${q}`, 303);
  if (!token || !/^[a-f0-9]{20,80}$/i.test(token)) return go("status=rechazado&prov=tbk&motivo=anulado");
  const r = await fetch(`${TBK.base}/${token}`, { method: "PUT", headers: TBK.headers() });
  const j = await r.json() as { status?: string; buy_order?: string; authorization_code?: string; response_code?: number };
  const ok = r.ok && j.status === "AUTHORIZED" && j.response_code === 0;
  return go(`status=${ok ? "aprobado" : "rechazado"}&prov=tbk&ref=${encodeURIComponent(j.buy_order ?? "")}&auth=${encodeURIComponent(j.authorization_code ?? "")}`);
}

export const Route = createFileRoute("/api/public/transbank/return")({
  server: { handlers: { GET: ({ request }) => handle(request), POST: ({ request }) => handle(request) } },
});
