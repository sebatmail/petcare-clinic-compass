import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Syringe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader, Field, NativeSelect } from "@/components/page";
import { useStore } from "@/lib/store";
import { uid, type Species } from "@/lib/clinic";

export const Route = createFileRoute("/mascotas")({
  head: () => ({ meta: [{ title: "Mascotas · PetCare" }, { name: "description", content: "Perfiles de pacientes con vacunas y datos clínicos." }, { property: "og:title", content: "Mascotas · PetCare" }, { property: "og:description", content: "Perfiles de pacientes de PetCare." }] }),
  component: Mascotas,
});

const schema = z.object({
  tutorId: z.string().min(1, "Selecciona tutor"), nombre: z.string().trim().min(2).max(40),
  especie: z.enum(["Perro", "Gato", "Conejo", "Otro"]), raza: z.string().trim().min(2, "Raza requerida").max(60),
  nacimiento: z.string().min(1, "Fecha requerida"), peso: z.coerce.number().positive("Peso inválido").max(150),
});
const edad = (n: string) => { const y = (Date.now() - new Date(n).getTime()) / 31557600000; return y < 1 ? `${Math.round(y * 12)} meses` : `${Math.floor(y)} años`; };

function Mascotas() {
  const s = useStore();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ tutorId: "", nombre: "", especie: "Perro", raza: "", nacimiento: "", peso: "" });
  const [vac, setVac] = useState<{ id: string; nombre: string; proxima: string } | null>(null);
  const save = () => {
    const r = schema.safeParse(f);
    if (!r.success) return toast.error(r.error.issues[0].message);
    s.set("mascotas", [...s.mascotas, { id: uid(), ...r.data, especie: r.data.especie as Species, vacunas: [] }]);
    setOpen(false); toast.success("Mascota registrada");
  };
  const addVac = () => {
    if (!vac || vac.nombre.trim().length < 2 || !vac.proxima) return toast.error("Completa vacuna y próxima fecha");
    s.set("mascotas", s.mascotas.map((m) => m.id === vac.id ? { ...m, vacunas: [...m.vacunas, { nombre: vac.nombre.trim(), fecha: new Date().toISOString().slice(0, 10), proxima: vac.proxima }] } : m));
    setVac(null); toast.success("Vacuna registrada");
  };
  return (
    <>
      <PageHeader title="Mascotas" subtitle="Pacientes registrados" action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus /> Nueva mascota</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Registrar mascota</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <Field label="Tutor"><NativeSelect value={f.tutorId} onChange={(e) => setF({ ...f, tutorId: e.target.value })}><option value="">Seleccionar…</option>{s.tutores.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}</NativeSelect></Field>
              <Field label="Nombre"><Input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Especie"><NativeSelect value={f.especie} onChange={(e) => setF({ ...f, especie: e.target.value })}>{["Perro", "Gato", "Conejo", "Otro"].map((x) => <option key={x}>{x}</option>)}</NativeSelect></Field>
                <Field label="Raza"><Input value={f.raza} onChange={(e) => setF({ ...f, raza: e.target.value })} /></Field>
                <Field label="Nacimiento"><Input type="date" value={f.nacimiento} onChange={(e) => setF({ ...f, nacimiento: e.target.value })} /></Field>
                <Field label="Peso (kg)"><Input type="number" step="0.1" value={f.peso} onChange={(e) => setF({ ...f, peso: e.target.value })} /></Field>
              </div>
              <Button onClick={save}>Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>} />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {s.mascotas.map((m) => (
          <Card key={m.id} className="shadow-card border-0 overflow-hidden">
            {m.foto ? <img src={m.foto} alt={m.nombre} className="aspect-square w-full object-cover" loading="lazy" width={816} height={816} />
              : <div className="grid aspect-square place-items-center bg-secondary text-6xl font-display text-primary">{m.nombre[0]}</div>}
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between"><h3 className="text-xl font-semibold">{m.nombre}</h3><Badge variant="secondary">{m.especie}</Badge></div>
              <p className="text-sm text-muted-foreground">{m.raza} · {edad(m.nacimiento)} · {m.peso} kg</p>
              <p className="text-sm">Tutor: {s.tutores.find((t) => t.id === m.tutorId)?.nombre}</p>
              <div className="space-y-1 pt-1">{m.vacunas.map((v, i) => <p key={i} className="flex items-center gap-2 text-xs text-muted-foreground"><Syringe className="size-3 text-primary" />{v.nombre} · próx. {v.proxima}</p>)}</div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => setVac({ id: m.id, nombre: "", proxima: "" })}><Syringe /> Registrar vacuna</Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={!!vac} onOpenChange={(o) => !o && setVac(null)}>
        <DialogContent><DialogHeader><DialogTitle>Registrar vacuna</DialogTitle></DialogHeader>
          {vac && <div className="grid gap-3">
            <Field label="Vacuna"><Input value={vac.nombre} onChange={(e) => setVac({ ...vac, nombre: e.target.value })} placeholder="Antirrábica" /></Field>
            <Field label="Próxima dosis"><Input type="date" value={vac.proxima} onChange={(e) => setVac({ ...vac, proxima: e.target.value })} /></Field>
            <Button onClick={addVac}>Guardar</Button>
          </div>}
        </DialogContent>
      </Dialog>
    </>
  );
}
