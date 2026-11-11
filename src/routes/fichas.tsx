import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pill, FlaskConical, Stethoscope, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader, Field, NativeSelect } from "@/components/page";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { uid } from "@/lib/clinic";

export const Route = createFileRoute("/fichas")({
  head: () => ({ meta: [{ title: "Fichas médicas · PetCare" }, { name: "description", content: "Historial clínico: diagnósticos, tratamientos, recetas y exámenes." }, { property: "og:title", content: "Fichas médicas · PetCare" }, { property: "og:description", content: "Historial clínico digital." }] }),
  component: Fichas,
});
const schema = z.object({
  mascotaId: z.string().min(1, "Selecciona paciente"), vetId: z.string().min(1),
  diagnostico: z.string().trim().min(3, "Diagnóstico requerido").max(300), tratamiento: z.string().trim().min(3, "Tratamiento requerido").max(500),
  receta: z.string().trim().max(500), examenes: z.string().trim().max(300), proximoControl: z.string().optional(),
});

function Fichas() {
  const s = useStore();
  const auth = useAuth();
  const [sel, setSel] = useState(s.mascotas[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  const vacio = { mascotaId: sel, vetId: s.vets[0]?.id ?? "", diagnostico: "", tratamiento: "", receta: "", examenes: "", proximoControl: "" };
  const [f, setF] = useState(vacio);
  const m = s.mascotas.find((x) => x.id === sel);
  const historial = s.fichas.filter((x) => x.mascotaId === sel).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const save = () => {
    const r = schema.safeParse(f);
    if (!r.success) { toast.error(r.error.issues[0]?.message ?? "Datos inválidos"); return; }
    s.set("fichas", [...s.fichas, { id: uid(), fecha: new Date().toISOString().slice(0, 10), ...r.data, proximoControl: r.data.proximoControl || undefined }]);
    setOpen(false); setSel(r.data.mascotaId); toast.success("Atención registrada en la ficha");
  };
  return (
    <>
      <PageHeader title="Fichas médicas" subtitle="Historial clínico completo por paciente" action={
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setF({ ...vacio, mascotaId: sel }); }}>
          <Button onClick={() => auth.requireAuth("create_ficha", () => setOpen(true))}><Plus /> Nueva atención</Button>
          <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Registrar atención</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Paciente"><NativeSelect value={f.mascotaId} onChange={(e) => setF({ ...f, mascotaId: e.target.value })}>{s.mascotas.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}</NativeSelect></Field>
                <Field label="Profesional"><NativeSelect value={f.vetId} onChange={(e) => setF({ ...f, vetId: e.target.value })}>{s.vets.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}</NativeSelect></Field>
              </div>
              <Field label="Diagnóstico"><Input value={f.diagnostico} onChange={(e) => setF({ ...f, diagnostico: e.target.value })} /></Field>
              <Field label="Tratamiento"><Textarea value={f.tratamiento} onChange={(e) => setF({ ...f, tratamiento: e.target.value })} /></Field>
              <Field label="Receta médica"><Textarea value={f.receta} onChange={(e) => setF({ ...f, receta: e.target.value })} /></Field>
              <Field label="Exámenes"><Input value={f.examenes} onChange={(e) => setF({ ...f, examenes: e.target.value })} /></Field>
              <Field label="Próximo control (genera recordatorio)"><Input type="date" value={f.proximoControl} onChange={(e) => setF({ ...f, proximoControl: e.target.value })} /></Field>
              <Button onClick={save}>Guardar en ficha</Button>
            </div>
          </DialogContent>
        </Dialog>} />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">{s.mascotas.map((x) => (
          <button key={x.id} onClick={() => setSel(x.id)} className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${sel === x.id ? "bg-primary text-primary-foreground shadow-card" : "bg-card hover:bg-secondary"}`}>
            <img src={x.foto} alt={x.nombre} className="size-11 rounded-full object-cover" /><div><p className="font-semibold">{x.nombre}</p><p className="text-xs opacity-75">{x.especie} · {x.raza}</p></div>
          </button>))}</div>
        <div className="space-y-4">
          {m && <Card className="shadow-card border-0"><CardContent className="flex flex-wrap items-center gap-5 p-5">
            <img src={m.foto} alt={m.nombre} className="size-20 rounded-2xl object-cover" />
            <div className="flex-1"><h2 className="text-2xl font-semibold">{m.nombre}</h2><p className="text-muted-foreground">{m.raza} · {m.peso} kg · Tutor: {s.tutores.find((t) => t.id === m.tutorId)?.nombre}</p></div>
            <Button variant="outline" onClick={() => window.print()}><Printer /> Imprimir ficha</Button>
          </CardContent></Card>}
          {historial.map((h) => (
            <Card key={h.id} className="shadow-card border-0">
              <CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle className="text-lg">{h.diagnostico}</CardTitle><span className="text-sm text-muted-foreground">{h.fecha} · {s.vets.find((v) => v.id === h.vetId)?.nombre}</span></CardHeader>
              <CardContent className="grid gap-3 text-sm md:grid-cols-3">
                <div><p className="mb-1 flex items-center gap-1 font-semibold text-primary"><Stethoscope className="size-4" />Tratamiento</p><p>{h.tratamiento}</p></div>
                <div><p className="mb-1 flex items-center gap-1 font-semibold text-primary"><Pill className="size-4" />Receta</p><p>{h.receta || "—"}</p></div>
                <div><p className="mb-1 flex items-center gap-1 font-semibold text-primary"><FlaskConical className="size-4" />Exámenes</p><p>{h.examenes || "—"}</p></div>
                {h.proximoControl && <p className="text-muted-foreground md:col-span-3">Próximo control: {h.proximoControl}</p>}
              </CardContent>
            </Card>))}
          {!historial.length && <p className="text-muted-foreground">Sin atenciones registradas.</p>}
        </div>
      </div>
    </>
  );
}
