import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2, Clock, Calendar, Stethoscope, Upload, Sparkles, X, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader, Field } from "@/components/page";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { uid } from "@/lib/clinic";

export const Route = createFileRoute("/profesionales")({
  head: () => ({
    meta: [
      { title: "Profesionales · PetCare" },
      { name: "description", content: "Equipo médico y disponibilidad horaria de cada veterinario." },
      { property: "og:title", content: "Profesionales · PetCare" },
      { property: "og:description", content: "Disponibilidad de veterinarios." },
    ],
  }),
  component: Profesionales,
});

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const PRESET_VET_PHOTOS = [
  { label: "👩‍⚕️ Dra. Valentina", url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80" },
  { label: "👨‍⚕️ Dr. Rodrigo", url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80" },
  { label: "👩‍⚕️ Dra. Morales", url: "https://images.unsplash.com/photo-1594824813571-638f02614d3f?auto=format&fit=crop&w=400&q=80" },
  { label: "👨‍⚕️ Dr. Castro", url: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80" },
];

const schema = z.object({
  nombre: z.string().trim().min(3, "Nombre requerido (mínimo 3 caracteres)").max(60),
  especialidad: z.string().trim().min(3, "Especialidad requerida").max(60),
  inicio: z.string().regex(/^\d{2}:\d{2}$/, "Hora de inicio inválida"),
  fin: z.string().regex(/^\d{2}:\d{2}$/, "Hora de término inválida"),
});

function Profesionales() {
  const s = useStore();
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    nombre: "",
    especialidad: "Medicina General",
    inicio: "09:00",
    fin: "18:00",
    dias: [1, 2, 3, 4, 5],
    foto: "",
  });

  const upd = (id: string, patch: object) => s.set("vets", s.vets.map((v) => (v.id === id ? { ...v, ...patch } : v)));

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona un archivo de imagen válido");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setF((prev) => ({ ...prev, foto: reader.result as string }));
        toast.success("Foto cargada");
      }
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    const r = schema.safeParse(f);
    if (!r.success) {
      toast.error(r.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    if (f.dias.length === 0) {
      toast.error("Selecciona al menos un día laboral");
      return;
    }
    if (f.inicio >= f.fin) {
      toast.error("La hora de inicio debe ser anterior a la hora de término");
      return;
    }
    const nuevoVet = {
      id: uid(),
      nombre: r.data.nombre,
      especialidad: r.data.especialidad,
      inicio: r.data.inicio,
      fin: r.data.fin,
      dias: f.dias,
      foto: f.foto.trim() || PRESET_VET_PHOTOS[0]?.url,
    };
    s.set("vets", [...s.vets, nuevoVet]);
    setOpen(false);
    setF({ nombre: "", especialidad: "Medicina General", inicio: "09:00", fin: "18:00", dias: [1, 2, 3, 4, 5], foto: "" });
    toast.success(`Profesional "${nuevoVet.nombre}" registrado`);
  };

  const deleteVet = (id: string, nombre: string) => {
    const citas = s.citas.filter((c) => c.vetId === id);
    if (citas.length > 0) {
      toast.error(`No se puede eliminar: tiene ${citas.length} citas asociadas en agenda`);
      return;
    }
    s.set("vets", s.vets.filter((v) => v.id !== id));
    toast.success(`Profesional "${nombre}" eliminado correctamente`);
  };

  return (
    <>
      <PageHeader
        title="Equipo Médico Veterinario"
        subtitle="Configura la disponibilidad horaria y profesionales para la prevención de solapamientos"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <Button onClick={() => auth.requireAuth("create_vet", () => setOpen(true))}>
              <Plus /> Nuevo Profesional
            </Button>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Médico Veterinario</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 pt-2">
                <Field label="Nombre Completo">
                  <Input
                    value={f.nombre}
                    onChange={(e) => setF({ ...f, nombre: e.target.value })}
                    placeholder="Ej: Dra. Camila Morales"
                  />
                </Field>

                <Field label="Especialidad Clínica">
                  <Input
                    value={f.especialidad}
                    onChange={(e) => setF({ ...f, especialidad: e.target.value })}
                    placeholder="Ej: Cirugía, Traumatología, Medicina General..."
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Hora Inicio">
                    <Input
                      type="time"
                      value={f.inicio}
                      onChange={(e) => setF({ ...f, inicio: e.target.value })}
                    />
                  </Field>
                  <Field label="Hora Término">
                    <Input
                      type="time"
                      value={f.fin}
                      onChange={(e) => setF({ ...f, fin: e.target.value })}
                    />
                  </Field>
                </div>

                <Field label="Días Laborales de Atención">
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {DIAS.map((d, i) => {
                      const active = f.dias.includes(i);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() =>
                            setF({
                              ...f,
                              dias: active ? f.dias.filter((x) => x !== i) : [...f.dias, i],
                            })
                          }
                          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                            active
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted text-muted-foreground border-input hover:bg-accent"
                          }`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {/* Foto / Avatar */}
                <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
                  <label className="text-xs font-semibold flex items-center gap-1.5">
                    <User className="size-3.5 text-primary" /> Fotografía Profesional
                  </label>
                  {f.foto ? (
                    <div className="relative mx-auto size-24 overflow-hidden rounded-2xl border-2 border-primary shadow-sm">
                      <img src={f.foto} alt="Avatar" className="size-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setF({ ...f, foto: "" })}
                        className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-black"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <label className="cursor-pointer flex-1">
                      <Button variant="outline" size="sm" type="button" className="w-full text-xs pointer-events-none" asChild>
                        <span><Upload className="size-3.5 mr-1" /> Subir foto</span>
                      </Button>
                      <input type="file" accept="image/*" onChange={handleImageFile} className="sr-only" />
                    </label>
                    <Input
                      placeholder="O URL de imagen..."
                      value={f.foto?.startsWith("data:") ? "" : f.foto}
                      onChange={(e) => setF({ ...f, foto: e.target.value })}
                      className="flex-[2] text-xs h-8"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                      <Sparkles className="size-2.5 text-amber-500" /> Presets recomendados:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {PRESET_VET_PHOTOS.map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => setF({ ...f, foto: p.url })}
                          className="rounded-md border bg-background px-2 py-0.5 text-[11px] hover:bg-primary/10 transition"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Button onClick={save} className="w-full mt-1">Guardar Profesional</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {s.vets.map((v) => (
          <Card key={v.id} className="shadow-card border-0 relative group">
            <CardContent className="flex gap-5 p-5">
              {v.foto ? (
                <img src={v.foto} alt={v.nombre} className="size-28 rounded-2xl object-cover" loading="lazy" />
              ) : (
                <div className="grid size-28 place-items-center rounded-2xl bg-secondary text-3xl font-display text-primary">
                  {v.nombre.charAt(0)}
                </div>
              )}
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold leading-tight">{v.nombre}</h3>
                    <p className="text-sm text-muted-foreground">{v.especialidad}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Eliminar profesional"
                    onClick={() => auth.requireAuth("delete_vet", () => deleteVet(v.id, v.nombre))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="size-3 text-primary" /> Días de atención:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {DIAS.map((d, i) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() =>
                          upd(v.id, {
                            dias: v.dias.includes(i) ? v.dias.filter((x) => x !== i) : [...v.dias, i],
                          })
                        }
                      >
                        <Badge variant={v.dias.includes(i) ? "default" : "outline"} className="cursor-pointer">
                          {d}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <Clock className="size-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Horario:</span>
                  <Input
                    type="time"
                    value={v.inicio}
                    onChange={(e) => upd(v.id, { inicio: e.target.value })}
                    className="w-24 h-7 text-xs"
                  />
                  <span>a</span>
                  <Input
                    type="time"
                    value={v.fin}
                    onChange={(e) => upd(v.id, { fin: e.target.value })}
                    className="w-24 h-7 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
