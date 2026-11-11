import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader, Field, NativeSelect } from "@/components/page";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { uid, validarCita, type EstadoCita } from "@/lib/clinic";

export const Route = createFileRoute("/agenda")({
  head: () => ({ meta: [{ title: "Agenda · PetCare" }, { name: "description", content: "Calendario veterinario por profesional sin solapamientos." }, { property: "og:title", content: "Agenda · PetCare" }, { property: "og:description", content: "Calendario veterinario dinámico." }] }),
  component: Agenda,
});
const HORAS = Array.from({ length: 21 }, (_, i) => `${String(9 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);
const estadoCls: Record<EstadoCita, string> = { Programada: "bg-secondary text-secondary-foreground", Confirmada: "bg-primary text-primary-foreground", Atendida: "bg-success text-primary-foreground", Cancelada: "bg-muted text-muted-foreground line-through" };

function Agenda() {
  const s = useStore();
  const auth = useAuth();
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ mascotaId: "", vetId: s.vets[0]?.id ?? "", hora: "10:00", duracion: 30, motivo: "" });
  const mover = (n: number) => { const d = new Date(fecha + "T12:00:00"); d.setDate(d.getDate() + n); setFecha(d.toISOString().slice(0, 10)); };
  const crear = () => {
    if (!f.mascotaId || f.motivo.trim().length < 3) { toast.error("Completa mascota y motivo"); return; }
    const nueva = { ...f, motivo: f.motivo.trim().slice(0, 120), fecha };
    const err = validarCita(nueva, s.vets.find((v) => v.id === f.vetId), s.citas);
    if (err) { toast.error(err); return; }
    s.set("citas", [...s.citas, { id: uid(), ...nueva, estado: "Programada" }]); setOpen(false); toast.success("Cita agendada");
  };
  const cambiar = (id: string, estado: EstadoCita) => s.set("citas", s.citas.map((c) => c.id === id ? { ...c, estado } : c));
  const dia = new Date(fecha + "T12:00:00").getDay();
  return (
    <>
      <PageHeader title="Agenda" subtitle={new Date(fecha + "T12:00:00").toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} action={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => mover(-1)} aria-label="Día anterior"><ChevronLeft /></Button>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-40" />
          <Button variant="outline" size="icon" onClick={() => mover(1)} aria-label="Día siguiente"><ChevronRight /></Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <Button onClick={() => auth.requireAuth("create_cita", () => setOpen(true))}><Plus /> Nueva cita</Button>
            <DialogContent><DialogHeader><DialogTitle>Agendar cita · {fecha}</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <Field label="Mascota"><NativeSelect value={f.mascotaId} onChange={(e) => setF({ ...f, mascotaId: e.target.value })}><option value="">Seleccionar…</option>{s.mascotas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}</NativeSelect></Field>
                <Field label="Profesional"><NativeSelect value={f.vetId} onChange={(e) => setF({ ...f, vetId: e.target.value })}>{s.vets.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}</NativeSelect></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Hora"><NativeSelect value={f.hora} onChange={(e) => setF({ ...f, hora: e.target.value })}>{HORAS.map((h) => <option key={h}>{h}</option>)}</NativeSelect></Field>
                  <Field label="Duración"><NativeSelect value={f.duracion} onChange={(e) => setF({ ...f, duracion: Number(e.target.value) })}>{[30, 60, 90].map((d) => <option key={d} value={d}>{d} min</option>)}</NativeSelect></Field>
                </div>
                <Field label="Motivo"><Input value={f.motivo} onChange={(e) => setF({ ...f, motivo: e.target.value })} maxLength={120} /></Field>
                <Button onClick={crear}>Agendar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>} />
      <Card className="shadow-card border-0 overflow-x-auto"><CardContent className="p-0">
        <div className="grid min-w-[640px]" style={{ gridTemplateColumns: `80px repeat(${s.vets.length}, 1fr)` }}>
          <div className="border-b p-3" />
          {s.vets.map((v) => (
            <div key={v.id} className="flex items-center gap-2 border-b border-l p-3">
              <img src={v.foto} alt={v.nombre} className="size-9 rounded-full object-cover" />
              <div><p className="text-sm font-semibold">{v.nombre}</p><p className="text-xs text-muted-foreground">{v.dias.includes(dia) ? `${v.inicio}–${v.fin}` : "No atiende"}</p></div>
            </div>))}
          {HORAS.map((h) => (
            <div key={h} className="contents">
              <div className="border-b p-2 font-mono text-xs text-muted-foreground">{h}</div>
              {s.vets.map((v) => {
                const libre = v.dias.includes(dia) && h >= v.inicio && h < v.fin;
                const c = s.citas.find((x) => x.vetId === v.id && x.fecha === fecha && x.hora === h);
                const m = c && s.mascotas.find((x) => x.id === c.mascotaId);
                return (
                  <div key={v.id} className={`min-h-12 border-b border-l p-1 ${libre ? "" : "bg-muted/60"}`}>
                    {c ? (
                      <div className={`rounded-lg p-2 text-xs ${estadoCls[c.estado]}`}>
                        <p className="font-semibold">{m?.nombre} · {c.duracion}′</p><p className="opacity-90">{c.motivo}</p>
                        <select value={c.estado} onChange={(e) => cambiar(c.id, e.target.value as EstadoCita)} className="mt-1 rounded bg-background/80 px-1 text-foreground">
                          {(["Programada", "Confirmada", "Atendida", "Cancelada"] as const).map((x) => <option key={x}>{x}</option>)}
                        </select>
                      </div>
                    ) : libre ? <button className="h-full w-full rounded-lg text-xs text-transparent hover:bg-secondary hover:text-primary" onClick={() => { setF({ ...f, vetId: v.id, hora: h }); setOpen(true); }}>+ Agendar</button> : null}
                  </div>);
              })}
            </div>))}
        </div>
      </CardContent></Card>
    </>
  );
}
