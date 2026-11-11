import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { CalendarDays, PawPrint, Users, BellRing, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { clp, recordatoriosPendientes } from "@/lib/clinic";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Dashboard · PetCare" },
    { name: "description", content: "Resumen diario de citas, pacientes, recordatorios e ingresos de PetCare." },
    { property: "og:title", content: "Dashboard · PetCare" },
    { property: "og:description", content: "Resumen diario de la clínica veterinaria PetCare." },
  ] }),
  component: Dashboard,
});

function Dashboard() {
  const s = useStore();
  const hoy = new Date().toISOString().slice(0, 10);
  const citasHoy = s.citas.filter((c) => c.fecha === hoy && c.estado !== "Cancelada").sort((a, b) => a.hora.localeCompare(b.hora));
  const recs = recordatoriosPendientes(s.mascotas, s.fichas, new Date(), 14);
  const ingresos = s.pagos.filter((p) => p.estado === "Aprobado").reduce((a, p) => a + p.monto, 0);
  const semana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 3 + i); const iso = d.toISOString().slice(0, 10);
    return { dia: d.toLocaleDateString("es-CL", { weekday: "short" }), citas: s.citas.filter((c) => c.fecha === iso && c.estado !== "Cancelada").length };
  });
  const pet = (id: string) => s.mascotas.find((m) => m.id === id);
  const vet = (id: string) => s.vets.find((v) => v.id === id);
  const kpis = [
    { label: "Citas hoy", value: citasHoy.length, icon: CalendarDays },
    { label: "Pacientes", value: s.mascotas.length, icon: PawPrint },
    { label: "Tutores", value: s.tutores.length, icon: Users },
    { label: "Recordatorios (14 días)", value: recs.length, icon: BellRing },
  ];
  return (
    <div className="space-y-6">
      <section className="bg-hero rounded-3xl p-8 text-primary-foreground shadow-card">
        <p className="text-sm opacity-80">{new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1 className="mt-1 text-4xl font-semibold">Buen día, equipo PetCare</h1>
        <p className="mt-2 max-w-xl opacity-90">Tienes {citasHoy.length} citas hoy y {recs.filter((r) => r.dias < 0).length} recordatorios vencidos. Ingresos aprobados: {clp(ingresos)}.</p>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="shadow-card border-0"><CardContent className="flex items-center gap-4 p-5">
            <div className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary"><k.icon /></div>
            <div><p className="text-3xl font-bold">{k.value}</p><p className="text-sm text-muted-foreground">{k.label}</p></div>
          </CardContent></Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="shadow-card border-0 xl:col-span-2">
          <CardHeader><CardTitle>Citas de la semana</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={semana}><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="dia" stroke="var(--muted-foreground)" /><YAxis allowDecimals={false} stroke="var(--muted-foreground)" /><Tooltip /><Bar dataKey="citas" fill="var(--primary)" radius={[8, 8, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0">
          <CardHeader className="flex-row items-center justify-between"><CardTitle>Recordatorios</CardTitle><Link to="/recordatorios" className="text-sm text-primary">Ver todos</Link></CardHeader>
          <CardContent className="space-y-3">
            {recs.slice(0, 5).map((r, i) => { const m = pet(r.mascotaId); return (
              <div key={i} className="flex items-center gap-3">
                <img src={m?.foto} alt={m?.nombre} className="size-10 rounded-full object-cover" loading="lazy" />
                <div className="flex-1"><p className="text-sm font-medium">{m?.nombre} · {r.detalle}</p><p className="text-xs text-muted-foreground">{r.fecha}</p></div>
                <Badge variant={r.dias < 0 ? "destructive" : "secondary"}>{r.dias < 0 ? "Vencido" : `${r.dias} d`}</Badge>
              </div>); })}
            {!recs.length && <p className="text-sm text-muted-foreground">Sin pendientes.</p>}
          </CardContent>
        </Card>
      </div>
      <Card className="shadow-card border-0">
        <CardHeader className="flex-row items-center justify-between"><CardTitle>Agenda de hoy</CardTitle><Link to="/agenda" className="flex items-center gap-1 text-sm text-primary">Abrir agenda <ArrowRight className="size-4" /></Link></CardHeader>
        <CardContent className="divide-y">
          {citasHoy.map((c) => { const m = pet(c.mascotaId); return (
            <div key={c.id} className="flex items-center gap-4 py-3">
              <span className="w-14 font-mono text-sm font-semibold text-primary">{c.hora}</span>
              <img src={m?.foto} alt={m?.nombre} className="size-10 rounded-full object-cover" loading="lazy" />
              <div className="flex-1"><p className="font-medium">{m?.nombre} — {c.motivo}</p><p className="text-sm text-muted-foreground">{vet(c.vetId)?.nombre}</p></div>
              <Badge variant="outline">{c.estado}</Badge>
            </div>); })}
          {!citasHoy.length && <p className="py-4 text-sm text-muted-foreground">No hay citas hoy.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
