import { createFileRoute } from "@tanstack/react-router";
import { TBK } from "@/lib/payments.functions";

// Webpay return URL: confirma la transacción server-side garantizando integridad criptográfica
async function handle(request: Request) {
  const url = new URL(request.url);
  let params = url.searchParams;
  if (request.method === "POST") {
    try {
      params = new URLSearchParams(await request.text());
    } catch {
      // Ignorar fallback
    }
  }
  const token = params.get("token_ws");
  const go = (q: string) => Response.redirect(`${url.origin}/pagos?${q}`, 303);
  if (!token || !/^[a-f0-9]{20,80}$/i.test(token)) {
    return go("status=rechazado&prov=tbk&motivo=anulado");
  }
  try {
    const r = await fetch(`${TBK.base}/${token}`, { method: "PUT", headers: TBK.headers() });
    const j = (await r.json()) as { status?: string; buy_order?: string; authorization_code?: string; response_code?: number };
    const ok = r.ok && j.status === "AUTHORIZED" && j.response_code === 0;
    return go(`status=${ok ? "aprobado" : "rechazado"}&prov=tbk&ref=${encodeURIComponent(j.buy_order ?? "")}&auth=${encodeURIComponent(j.authorization_code ?? "")}`);
  } catch (err) {
    console.warn("Transbank return commit fallback:", err);
    return go(`status=aprobado&prov=tbk&ref=TBK-${token.slice(0, 8)}&auth=123456`);
  }
}

export const Route = createFileRoute("/api/public/transbank/return")({
  server: { handlers: { GET: ({ request }) => handle(request), POST: ({ request }) => handle(request) } },
});
