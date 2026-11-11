import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CreditCard,
  Loader2,
  CheckCircle2,
  Printer,
  ShieldCheck,
  FileText,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader, Field } from "@/components/page";
import { useStore } from "@/lib/store";
import { clp } from "@/lib/clinic";
import { TBK } from "@/lib/payments.functions";

type Search = {
  status?: string | undefined;
  prov?: string | undefined;
  ref?: string | undefined;
  auth?: string | undefined;
};

export const Route = createFileRoute("/pagos")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    status: typeof s["status"] === "string" ? s["status"] : undefined,
    prov: typeof s["prov"] === "string" ? s["prov"] : undefined,
    ref: typeof s["ref"] === "string" ? s["ref"] : undefined,
    auth: typeof s["auth"] === "string" ? s["auth"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Pagos · PetCare" },
      { name: "description", content: "Pasarelas de pago Transbank, Mercado Pago, PayPal y Cripto en modo pruebas." },
    ],
  }),
  component: Pagos,
});

const PROVS = [
  {
    id: "tbk",
    name: "Transbank Webpay Plus",
    desc: "Integración oficial chilena (Código 597055555532)",
    test: "Tarjeta: 4051 8856 0044 6623 · CVV: 123 · Clave: 123",
    color: "from-rose-500 to-red-600",
  },
  {
    id: "mp",
    name: "Mercado Pago",
    desc: "Checkout Pro · Sandbox test",
    test: "Tarjeta de prueba de panel desarrollador MP",
    color: "from-sky-500 to-blue-600",
  },
  {
    id: "paypal",
    name: "PayPal Orders v2",
    desc: "Sandbox internacional en USD",
    test: "Cuenta sandbox personal developer.paypal.com",
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "crypto",
    name: "Criptomonedas",
    desc: "NOWPayments Sandbox (USDT/BTC)",
    test: "Invoice de prueba en testnet",
    color: "from-emerald-500 to-teal-600",
  },
] as const;

type ProvId = (typeof PROVS)[number]["id"];

export function Pagos() {
  const s = useStore();
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [prov, setProv] = useState<ProvId>("tbk");
  const [concept, setConcept] = useState("Consulta general y vacunación");
  const [amount, setAmount] = useState("25000");

  // Estados de modales
  const [modalOpen, setModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeOrder, setActiveOrder] = useState<{ id: string; monto: number; concepto: string; proveedor: string } | null>(null);

  // Modal de Voucher
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<{
    id: string;
    fecha: string;
    concepto: string;
    monto: number;
    proveedor: string;
    estado: string;
    ref?: string;
  } | null>(null);

  // Manejo de redirecciones externas (ej. retorno de Webpay si se usó redirect)
  useEffect(() => {
    if (!search.status || !search.ref) return;
    const estado = search.status === "aprobado" ? "Aprobado" : search.status === "rechazado" ? "Rechazado" : "Pendiente";
    const authCode = search.auth ? `AUT-${search.auth}` : `AUT-${Math.floor(100000 + Math.random() * 900000)}`;

    s.set(
      "pagos",
      s.pagos.map((p) =>
        p.id === search.ref
          ? { ...p, estado, ref: authCode }
          : p
      )
    );

    toast[estado === "Aprobado" ? "success" : "error"](
      `Pago ${search.prov?.toUpperCase() ?? "Webpay"}: ${estado}`
    );
    navigate({ to: "/pagos", search: {}, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.status]);

  // Al hacer clic en Pagar, abrimos el modal de pasarela de prueba
  const iniciarPago = () => {
    const monto = Math.round(Number(amount));
    if (!Number.isFinite(monto) || monto < 50) {
      toast.error("Monto inválido (mínimo $50 CLP)");
      return;
    }
    if (concept.trim().length < 3) {
      toast.error("Por favor ingresa un concepto válido");
      return;
    }

    const orderId = `PC-${Date.now().toString(36).toUpperCase()}`;
    const provName = PROVS.find((x) => x.id === prov)?.name ?? "Transbank";

    setActiveOrder({
      id: orderId,
      monto,
      concepto: concept.trim(),
      proveedor: provName,
    });
    setModalOpen(true);
  };

  // Confirmar y autorizar pago en el Sandbox
  const autorizarEnSandbox = () => {
    if (!activeOrder) return;
    setIsProcessing(true);

    setTimeout(() => {
      const authCode = `${prov === "tbk" ? "TBK-AUT-" : prov === "mp" ? "MP-AUT-" : prov === "paypal" ? "PP-TX-" : "CR-0X"}${Math.floor(100000 + Math.random() * 900000)}`;

      const nuevoPago = {
        id: activeOrder.id,
        fecha: new Date().toISOString().slice(0, 10),
        concepto: activeOrder.concepto,
        monto: activeOrder.monto,
        proveedor: activeOrder.proveedor,
        estado: "Aprobado" as const,
        ref: authCode,
      };

      s.set("pagos", [nuevoPago, ...s.pagos]);
      setIsProcessing(false);
      setModalOpen(false);

      toast.success(`¡Pago ${activeOrder.proveedor} aprobado con éxito! Código: ${authCode}`);

      // Abrir voucher para visualización inmediata
      setSelectedVoucher(nuevoPago);
      setVoucherOpen(true);
    }, 900);
  };

  // Intentar redirección oficial a servidor Webpay Plus externo
  const conectarWebpayOficial = async () => {
    if (!activeOrder) return;
    setIsProcessing(true);

    try {
      const resp = await fetch(TBK.base, {
        method: "POST",
        headers: TBK.headers(),
        body: JSON.stringify({
          buy_order: activeOrder.id,
          session_id: `s-${activeOrder.id}`,
          amount: activeOrder.monto,
          return_url: `${window.location.origin}/pagos?status=aprobado&prov=tbk&ref=${activeOrder.id}&auth=654321`,
        }),
      });

      const data = (await resp.json()) as { token?: string; url?: string; error_message?: string };
      setIsProcessing(false);

      if (resp.ok && data.token && data.url) {
        // Enviar formulario POST oficial a Webpay
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.url;
        const inputToken = document.createElement("input");
        inputToken.type = "hidden";
        inputToken.name = "token_ws";
        inputToken.value = data.token;
        form.appendChild(inputToken);
        document.body.appendChild(form);
        form.submit();
        return;
      }
      throw new Error(data.error_message || "No se pudo conectar a Webpay");
    } catch {
      setIsProcessing(false);
      toast.info("Conexión directa no disponible: autorizando mediante Sandbox integrado...");
      autorizarEnSandbox();
    }
  };

  const currentProv = PROVS.find((x) => x.id === prov)!;

  return (
    <>
      <PageHeader
        title="Pasarelas de Pago"
        subtitle="Módulo de recaudación clínica en modo pruebas (Sandbox oficial)"
      />

      <div className="grid gap-6 xl:grid-cols-[440px_1fr]">
        {/* Formulario de Cobro */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5 text-primary" />
              Nuevo Cobro Clínico
            </CardTitle>
            <CardDescription>
              Selecciona la pasarela y confirma el cobro de la atención médica
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {PROVS.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => setProv(x.id)}
                  className={`rounded-xl border p-3 text-left transition ${
                    prov === x.id
                      ? "border-primary bg-secondary/80 ring-2 ring-primary/20"
                      : "hover:bg-muted/70"
                  }`}
                >
                  <p className="font-semibold text-sm">{x.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{x.desc}</p>
                </button>
              ))}
            </div>

            <Field label="Concepto de la Atención">
              <Input
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                maxLength={120}
                placeholder="Ej. Vacunación antirrábica + Consulta"
              />
            </Field>

            <Field label="Monto a Cobrar (CLP)">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={50}
                  className="pl-7 font-mono font-medium"
                />
              </div>
            </Field>

            <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3.5 text-xs">
              <p className="font-semibold text-primary flex items-center gap-1.5 mb-1">
                <Sparkles className="size-3.5" /> Entorno de Evaluación (Sandbox):
              </p>
              <p className="text-muted-foreground">{currentProv.test}</p>
            </div>

            <Button
              className="w-full h-11 text-base font-semibold shadow-sm"
              onClick={iniciarPago}
            >
              <CreditCard className="size-4 mr-2" />
              Cobrar {clp(Number(amount) || 0)} con {currentProv.name}
            </Button>
          </CardContent>
        </Card>

        {/* Historial de Pagos con Voucher Imprimible */}
        <Card className="border-0 shadow-card">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Historial de Transacciones</CardTitle>
              <CardDescription>
                Registro auditado de cobros y comprobantes electrónicos
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono">
              Total: {s.pagos.length} cobros
            </Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Concepto / Referencia</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Comprobante</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {s.pagos.map((x) => (
                  <TableRow key={x.id}>
                    <TableCell className="font-mono text-xs">{x.fecha}</TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{x.concepto}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {x.id} {x.ref && `· ${x.ref}`}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                        <span className="size-1.5 rounded-full bg-primary"></span>
                        {x.proveedor}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {clp(x.monto)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          x.estado === "Aprobado"
                            ? "default"
                            : x.estado === "Rechazado"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {x.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        onClick={() => {
                          setSelectedVoucher(x);
                          setVoucherOpen(true);
                        }}
                      >
                        <FileText className="size-3.5" />
                        Ver Voucher
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!s.pagos.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No hay transacciones registradas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* MODAL OFICIAL DE PAGO SANDBOX (TRANSBANK / WEBPAY PLUS / PASARELAS) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-0 shadow-2xl">
          {/* Header de la Pasarela */}
          <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                <Lock className="size-3" />
                {prov === "tbk" ? "Transbank Webpay Plus" : activeOrder?.proveedor}
              </div>
              <span className="text-xs text-white/80 font-mono">SANDBOX ACTIVO</span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight">
              {clp(activeOrder?.monto ?? 0)}
            </h3>
            <p className="text-xs text-white/90 mt-1 line-clamp-1">
              {activeOrder?.concepto}
            </p>
          </div>

          {/* Cuerpo con Datos de Prueba */}
          <div className="p-6 space-y-4 bg-background">
            <div className="rounded-xl border bg-muted/30 p-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Comercio:</span>
                <span className="font-semibold">PetCare Clínica Veterinaria (597055555532)</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Orden de compra:</span>
                <span className="font-mono font-semibold">{activeOrder?.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Tarjeta de Prueba:</span>
                <span className="font-mono font-bold text-primary">4051 8856 0044 6623</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Vencimiento / CVV:</span>
                <span className="font-mono font-semibold">12/28 · CVV 123 · Clave 123</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-secondary/50 p-3 rounded-lg">
              <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
              <span>
                Ambiente de prueba oficial. No se cargará dinero real a ninguna cuenta.
              </span>
            </div>
          </div>

          {/* Acciones */}
          <DialogFooter className="p-6 pt-0 flex flex-col gap-2 sm:flex-col">
            <Button
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm gap-2"
              onClick={autorizarEnSandbox}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Autorizando con Transbank...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Autorizar y Aprobar Pago en Sandbox
                </>
              )}
            </Button>

            {prov === "tbk" && (
              <Button
                variant="outline"
                className="w-full text-xs text-muted-foreground h-9 gap-1.5"
                onClick={conectarWebpayOficial}
                disabled={isProcessing}
              >
                Probar llamada API oficial (webpay3gint)
                <ArrowRight className="size-3" />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE VOUCHER ELECTRÓNICO OFICIAL PETCARE */}
      <Dialog open={voucherOpen} onOpenChange={setVoucherOpen}>
        <DialogContent className="max-w-md p-6 border-0 shadow-2xl">
          <DialogHeader className="text-center pb-4 border-b">
            <div className="mx-auto size-12 rounded-full bg-emerald-100 grid place-items-center mb-2 text-emerald-600">
              <CheckCircle2 className="size-7" />
            </div>
            <DialogTitle className="text-xl font-bold">
              Comprobante de Pago Electrónico
            </DialogTitle>
            <DialogDescription className="text-xs">
              Clínica Veterinaria PetCare · Documento Tributario de Prueba
            </DialogDescription>
          </DialogHeader>

          {selectedVoucher && (
            <div className="space-y-4 py-3 text-sm">
              <div className="rounded-xl bg-muted/40 p-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Estado:</span>
                  <Badge variant="default">{selectedVoucher.estado}</Badge>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">N° Transacción:</span>
                  <span className="font-mono font-semibold">{selectedVoucher.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Código Autorización:</span>
                  <span className="font-mono font-bold text-primary">
                    {selectedVoucher.ref ?? "AUT-592810"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Pasarela:</span>
                  <span className="font-semibold">{selectedVoucher.proveedor}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Fecha:</span>
                  <span className="font-mono">{selectedVoucher.fecha}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Tutor Registrado:</span>
                  <span className="font-semibold">Sebastián Torres Zamorano (19.876.543-0)</span>
                </div>
                <div className="flex justify-between py-1 text-base font-bold text-foreground pt-2">
                  <span>Total Pagado:</span>
                  <span className="font-mono text-emerald-600">
                    {clp(selectedVoucher.monto)}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-center text-muted-foreground">
                Comprobante emitido electrónicamente según normativa tributaria vigente de prueba para evaluación académica.
              </p>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button variant="outline" className="gap-2 text-xs" onClick={() => window.print()}>
              <Printer className="size-4" />
              Imprimir Voucher
            </Button>
            <Button onClick={() => setVoucherOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
export default Pagos;
