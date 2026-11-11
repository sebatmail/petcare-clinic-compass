import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CreditCard, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, Field } from "@/components/page";
import { useStore } from "@/lib/store";
import { clp } from "@/lib/clinic";
import { payTransbank, payMercadoPago, payPayPal, payCrypto } from "@/lib/payments.functions";

type Search = { status?: string | undefined; prov?: string | undefined; ref?: string | undefined; auth?: string | undefined };
export const Route = createFileRoute("/pagos")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    status: typeof s["status"] === "string" ? s["status"] : undefined, prov: typeof s["prov"] === "string" ? s["prov"] : undefined,
    ref: typeof s["ref"] === "string" ? s["ref"] : undefined, auth: typeof s["auth"] === "string" ? s["auth"] : undefined,
  }),
  head: () => ({ meta: [{ title: "Pagos · PetCare" }, { name: "description", content: "Cobros con Transbank, Mercado Pago, PayPal y cripto en modo pruebas." }, { property: "og:title", content: "Pagos · PetCare" }, { property: "og:description", content: "Pasarelas de pago en modo pruebas." }] }),
  component: Pagos,
});

const PROVS = [
  { id: "tbk", name: "Transbank", desc: "Webpay Plus · integración", fn: payTransbank, test: "Tarjeta 4051 8856 0044 6623 · CVV 123 · RUT 11.111.111-1 · clave 123" },
  { id: "mp", name: "Mercado Pago", desc: "Checkout Pro · sandbox", fn: payMercadoPago, test: "Usa usuarios y tarjetas de prueba de tu panel MP" },
  { id: "paypal", name: "PayPal", desc: "Orders v2 · sandbox", fn: payPayPal, test: "Cuenta personal sandbox de developer.paypal.com" },
  { id: "crypto", name: "Cripto", desc: "NOWPayments · sandbox", fn: payCrypto, test: "Invoice de prueba en api-sandbox.nowpayments.io" },
] as const;
const NAMES: Record<string, string> = { tbk: "Transbank", mp: "Mercado Pago", paypal: "PayPal", crypto: "Cripto" };

function Pagos() {
  const s = useStore();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [prov, setProv] = useState<(typeof PROVS)[number]["id"]>("tbk");
  const [concept, setConcept] = useState("Consulta general");
  const [amount, setAmount] = useState("25000");
  const [loading, setLoading] = useState(false);
  const fns = { tbk: useServerFn(payTransbank), mp: useServerFn(payMercadoPago), paypal: useServerFn(payPayPal), crypto: useServerFn(payCrypto) };

  useEffect(() => {
    if (!search.status || !search.ref) return;
    const estado = search.status === "aprobado" ? "Aprobado" : search.status === "rechazado" ? "Rechazado" : "Pendiente";
    s.set("pagos", s.pagos.map((p) => p.id === search.ref ? { ...p, estado, ref: search.auth ? `AUT ${search.auth}` : p.ref } : p));
    toast[estado === "Aprobado" ? "success" : estado === "Rechazado" ? "error" : "info"](`Pago ${NAMES[search.prov ?? ""] ?? ""}: ${estado}`);
    navigate({ to: "/pagos", search: {}, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.status]);

  const pagar = async () => {
    const monto = Math.round(Number(amount));
    if (!Number.isFinite(monto) || monto < 50) { toast.error("Monto inválido (mínimo $50)"); return; }
    if (concept.trim().length < 3) { toast.error("Concepto requerido"); return; }
    const orderId = `PC-${Date.now().toString(36).toUpperCase()}`;
    setLoading(true);
    const r = await fns[prov]({ data: { amount: monto, concept: concept.trim(), orderId, origin: window.location.origin } }).catch(() => ({ ok: false as const, error: "Datos inválidos" }));
    setLoading(false);
    if (!r.ok) { toast.error(r.error); return; }
    s.set("pagos", [{ id: orderId, fecha: new Date().toISOString().slice(0, 10), concepto: concept.trim(), monto, proveedor: NAMES[prov] ?? prov, estado: "Pendiente" }, ...s.pagos]);
    if (prov === "tbk" && r.token) {
      const f = document.createElement("form"); f.method = "POST"; f.action = r.url;
      const i = document.createElement("input"); i.type = "hidden"; i.name = "token_ws"; i.value = r.token; f.appendChild(i);
      document.body.appendChild(f); f.submit();
    } else window.location.href = r.url;
  };
  const p = PROVS.find((x) => x.id === prov)!;
  return (
    <>
      <PageHeader title="Pagos" subtitle="Pasarelas en modo pruebas — no se cobra dinero real" />
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card className="shadow-card border-0">
          <CardHeader><CardTitle>Nuevo cobro</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">{PROVS.map((x) => (
              <button key={x.id} onClick={() => setProv(x.id)} className={`rounded-xl border p-3 text-left transition ${prov === x.id ? "border-primary bg-secondary" : "hover:bg-muted"}`}>
                <p className="font-semibold">{x.name}</p><p className="text-xs text-muted-foreground">{x.desc}</p>
              </button>))}</div>
            <Field label="Concepto"><Input value={concept} onChange={(e) => setConcept(e.target.value)} maxLength={120} /></Field>
            <Field label="Monto (CLP)"><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={50} /></Field>
            <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">Prueba: {p.test}</p>
            <Button className="w-full" onClick={pagar} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <CreditCard />} Pagar {clp(Number(amount) || 0)} con {p.name}</Button>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0">
          <CardHeader><CardTitle>Historial</CardTitle></CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Concepto</TableHead><TableHead>Proveedor</TableHead><TableHead className="text-right">Monto</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
              <TableBody>{s.pagos.map((x) => (
                <TableRow key={x.id}><TableCell>{x.fecha}</TableCell><TableCell>{x.concepto}<p className="text-xs text-muted-foreground">{x.id} {x.ref}</p></TableCell><TableCell>{x.proveedor}</TableCell><TableCell className="text-right font-medium">{clp(x.monto)}</TableCell>
                  <TableCell><Badge variant={x.estado === "Aprobado" ? "default" : x.estado === "Rechazado" ? "destructive" : "secondary"}>{x.estado}</Badge></TableCell></TableRow>))}
              </TableBody></Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
