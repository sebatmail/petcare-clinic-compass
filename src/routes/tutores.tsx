import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Mail, Phone, MapPin, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader, Field } from "@/components/page";
import { useStore } from "@/lib/store";
import { uid, validarRut } from "@/lib/clinic";

export const Route = createFileRoute("/tutores")({
  head: () => ({ meta: [{ title: "Tutores · PetCare" }, { name: "description", content: "Registro y perfiles de tutores de mascotas." }, { property: "og:title", content: "Tutores · PetCare" }, { property: "og:description", content: "Registro y perfiles de tutores." }] }),
  component: Tutores,
});

const schema = z.object({
  nombre: z.string().trim().min(3, "Nombre muy corto").max(80),
  rut: z.string().trim().refine(validarRut, "RUT inválido"),
  email: z.string().trim().email("Email inválido").max(120),
  telefono: z.string().trim().regex(/^\+?[\d\s]{8,15}$/, "Teléfono inválido"),
  direccion: z.string().trim().min(5, "Dirección requerida").max(150),
});

function Tutores() {
  const s = useStore();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [f, setF] = useState({ nombre: "", rut: "", email: "", telefono: "", direccion: "" });
  const save = () => {
    const r = schema.safeParse(f);
    if (!r.success) { toast.error(r.error.issues[0]?.message ?? "Datos inválidos"); return; }
    if (s.tutores.some((t) => t.rut.replace(/\D/g, "") === r.data.rut.replace(/\D/g, ""))) { toast.error("Ya existe un tutor con ese RUT"); return; }
    s.set("tutores", [...s.tutores, { id: uid(), ...r.data }]);
    setOpen(false); setF({ nombre: "", rut: "", email: "", telefono: "", direccion: "" }); toast.success("Tutor registrado");
  };
  const list = s.tutores.filter((t) => (t.nombre + t.rut).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader title="Tutores" subtitle="Responsables de cada paciente" action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus /> Nuevo tutor</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Registrar tutor</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              {(["nombre", "rut", "email", "telefono", "direccion"] as const).map((k) => (
                <Field key={k} label={k.charAt(0).toUpperCase() + k.slice(1)}><Input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} placeholder={k === "rut" ? "12.345.678-5" : ""} /></Field>
              ))}
              <Button onClick={save}>Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>} />
      <Input placeholder="Buscar por nombre o RUT…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-5 max-w-sm" />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {list.map((t) => { const pets = s.mascotas.filter((m) => m.tutorId === t.id); return (
          <Card key={t.id} className="shadow-card border-0 overflow-hidden">
            <div className="bg-hero h-16" />
            <CardContent className="-mt-10 space-y-3">
              <div className="flex items-end justify-between">
                {t.foto ? <img src={t.foto} alt={t.nombre} className="size-20 rounded-2xl border-4 border-card object-cover" loading="lazy" />
                  : <div className="grid size-20 place-items-center rounded-2xl border-4 border-card bg-secondary text-2xl font-bold text-primary">{t.nombre.charAt(0)}</div>}
                <Button variant="ghost" size="icon" aria-label="Eliminar" onClick={() => { if (pets.length) { toast.error("Tiene mascotas asociadas"); return; } s.set("tutores", s.tutores.filter((x) => x.id !== t.id)); }}><Trash2 /></Button>
              </div>
              <div><h3 className="text-xl font-semibold">{t.nombre}</h3><p className="text-sm text-muted-foreground">RUT {t.rut}</p></div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="flex items-center gap-2"><Mail className="size-4" />{t.email}</p>
                <p className="flex items-center gap-2"><Phone className="size-4" />{t.telefono}</p>
                <p className="flex items-center gap-2"><MapPin className="size-4" />{t.direccion}</p>
              </div>
              <div className="flex -space-x-2">{pets.map((m) => <img key={m.id} src={m.foto} alt={m.nombre} title={m.nombre} className="size-9 rounded-full border-2 border-card object-cover" loading="lazy" />)}</div>
            </CardContent>
          </Card>); })}
      </div>
    </>
  );
}
