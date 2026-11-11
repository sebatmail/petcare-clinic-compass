import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Syringe, Upload, Sparkles, X, Image as ImageIcon, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader, Field, NativeSelect } from "@/components/page";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { uid, type Species } from "@/lib/clinic";

export const Route = createFileRoute("/mascotas")({
  head: () => ({ meta: [{ title: "Mascotas · PetCare" }, { name: "description", content: "Perfiles de pacientes con vacunas y datos clínicos." }, { property: "og:title", content: "Mascotas · PetCare" }, { property: "og:description", content: "Perfiles de pacientes de PetCare." }] }),
  component: Mascotas,
});

const schema = z.object({
  tutorId: z.string().min(1, "Selecciona tutor"), nombre: z.string().trim().min(2, "Nombre requerido").max(40),
  especie: z.enum(["Perro", "Gato", "Conejo", "Otro"]), raza: z.string().trim().min(2, "Raza requerida").max(60),
  nacimiento: z.string().min(1, "Fecha requerida"), peso: z.coerce.number().positive("Peso inválido").max(150),
});
const edad = (n: string) => { const y = (Date.now() - new Date(n).getTime()) / 31557600000; return y < 1 ? `${Math.round(y * 12)} meses` : `${Math.floor(y)} años`; };

const PRESET_PET_PHOTOS = [
  { label: "🐶 Golden", url: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80" },
  { label: "🐱 Siamés", url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80" },
  { label: "🐕 Pastor", url: "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&w=600&q=80" },
  { label: "🐰 Conejo", url: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=600&q=80" },
  { label: "🐶 Bulldog", url: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80" },
  { label: "🐱 Persa", url: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80" },
];

function Mascotas() {
  const s = useStore();
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ tutorId: "", nombre: "", especie: "Perro", raza: "", nacimiento: "", peso: "", foto: "" });
  const [vac, setVac] = useState<{ id: string; nombre: string; proxima: string } | null>(null);

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona un archivo de imagen válido");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen debe pesar menos de 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setF((prev) => ({ ...prev, foto: reader.result as string }));
        toast.success("Foto cargada con éxito");
      }
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    const r = schema.safeParse(f);
    if (!r.success) { toast.error(r.error.issues[0]?.message ?? "Datos inválidos"); return; }
    const fotoFinal = f.foto.trim() || undefined;
    const nuevaMascota = { id: uid(), ...r.data, especie: r.data.especie as Species, foto: fotoFinal, vacunas: [] };
    s.set("mascotas", [...s.mascotas, nuevaMascota]);
    setOpen(false);
    setF({ tutorId: "", nombre: "", especie: "Perro", raza: "", nacimiento: "", peso: "", foto: "" });
    toast.success(`Mascota "${nuevaMascota.nombre}" registrada exitosamente`);

    // Persistencia asíncrona hacia Django REST Framework (PostgreSQL)
    try {
      await fetch("/api/mascotas/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nuevaMascota.nombre,
          especie: nuevaMascota.especie === "Perro" ? "CANINO" : nuevaMascota.especie === "Gato" ? "FELINO" : nuevaMascota.especie === "Conejo" ? "ROEDOR" : "OTRO",
          raza: nuevaMascota.raza,
          fecha_nacimiento: nuevaMascota.nacimiento,
          peso_kg: nuevaMascota.peso,
          tutor: 1,
          foto_url: nuevaMascota.foto ?? "",
        }),
      });
    } catch {
      // Sin bloqueo si corre en entorno aislado
    }
  };

  const addVac = () => {
    if (!vac || vac.nombre.trim().length < 2 || !vac.proxima) { toast.error("Completa vacuna y próxima fecha"); return; }
    s.set("mascotas", s.mascotas.map((m) => m.id === vac.id ? { ...m, vacunas: [...m.vacunas, { nombre: vac.nombre.trim(), fecha: new Date().toISOString().slice(0, 10), proxima: vac.proxima }] } : m));
    setVac(null); toast.success("Vacuna registrada");
  };

  return (
    <>
      <PageHeader title="Mascotas" subtitle="Pacientes registrados con ficha clínica biométrica" action={
        <Dialog open={open} onOpenChange={setOpen}>
          <Button onClick={() => auth.requireAuth("create_pet", () => setOpen(true))}><Plus /> Nueva mascota</Button>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Registrar nueva mascota</DialogTitle></DialogHeader>
            <div className="grid gap-3 pt-2">
              <Field label="Tutor Responsable">
                <NativeSelect value={f.tutorId} onChange={(e) => setF({ ...f, tutorId: e.target.value })}>
                  <option value="">Seleccionar tutor…</option>
                  {s.tutores.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </NativeSelect>
              </Field>
              <Field label="Nombre del Paciente">
                <Input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} placeholder="Ej: Toby, Pelusa, Milo..." />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Especie">
                  <NativeSelect value={f.especie} onChange={(e) => setF({ ...f, especie: e.target.value })}>
                    {["Perro", "Gato", "Conejo", "Otro"].map((x) => <option key={x}>{x}</option>)}
                  </NativeSelect>
                </Field>
                <Field label="Raza">
                  <Input value={f.raza} onChange={(e) => setF({ ...f, raza: e.target.value })} placeholder="Ej: Siamés, Golden..." />
                </Field>
                <Field label="Fecha Nacimiento">
                  <Input type="date" value={f.nacimiento} onChange={(e) => setF({ ...f, nacimiento: e.target.value })} />
                </Field>
                <Field label="Peso Actual (kg)">
                  <Input type="number" step="0.1" value={f.peso} onChange={(e) => setF({ ...f, peso: e.target.value })} placeholder="Ej: 14.5" />
                </Field>
              </div>

              {/* Selector de Fotografía manual / presets */}
              <div className="rounded-xl border bg-muted/30 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold flex items-center gap-1.5">
                    <ImageIcon className="size-3.5 text-primary" /> Foto del Paciente
                  </label>
                  {f.foto && (
                    <button
                      type="button"
                      onClick={() => setF({ ...f, foto: "" })}
                      className="text-[11px] text-destructive hover:underline flex items-center gap-0.5"
                    >
                      <X className="size-3" /> Quitar foto
                    </button>
                  )}
                </div>

                {f.foto ? (
                  <div className="relative mx-auto size-28 overflow-hidden rounded-xl border-2 border-primary shadow-sm">
                    <img src={f.foto} alt="Vista previa" className="size-full object-cover" />
                  </div>
                ) : (
                  <div className="grid place-items-center rounded-lg border border-dashed py-3 text-center">
                    <Upload className="size-6 text-muted-foreground/60 mb-1" />
                    <p className="text-[11px] text-muted-foreground">Sube una foto o selecciona un preset rápido</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <label className="cursor-pointer flex-1">
                    <Button variant="outline" size="sm" type="button" className="w-full text-xs pointer-events-none" asChild>
                      <span><Upload className="size-3.5 mr-1" /> Subir desde PC</span>
                    </Button>
                    <input type="file" accept="image/*" onChange={handleImageFile} className="sr-only" />
                  </label>
                  <Input
                    placeholder="O pega URL de imagen..."
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
                    {PRESET_PET_PHOTOS.map((p) => (
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

              <Button onClick={save} className="w-full mt-1">Guardar Mascota</Button>
            </div>
          </DialogContent>
        </Dialog>} />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {s.mascotas.map((m) => (
          <Card key={m.id} className="shadow-card border-0 overflow-hidden relative group">
            {m.foto ? <img src={m.foto} alt={m.nombre} className="aspect-square w-full object-cover" loading="lazy" width={816} height={816} />
              : <div className="grid aspect-square place-items-center bg-secondary text-6xl font-display text-primary">{m.nombre[0]}</div>}
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{m.nombre}</h3>
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary">{m.especie}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Eliminar mascota"
                    onClick={() => {
                      auth.requireAuth("delete_pet", () => {
                        const citas = s.citas.filter((c) => c.mascotaId === m.id);
                        if (citas.length > 0) {
                          toast.error(`No se puede eliminar: tiene ${citas.length} citas registradas`);
                          return;
                        }
                        s.set("mascotas", s.mascotas.filter((x) => x.id !== m.id));
                        toast.success(`Mascota "${m.nombre}" eliminada`);
                      });
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{m.raza} · {edad(m.nacimiento)} · {m.peso} kg</p>
              <p className="text-sm">Tutor: {s.tutores.find((t) => t.id === m.tutorId)?.nombre}</p>
              <div className="space-y-1 pt-1">{m.vacunas.map((v, i) => <p key={i} className="flex items-center gap-2 text-xs text-muted-foreground"><Syringe className="size-3 text-primary" />{v.nombre} · próx. {v.proxima}</p>)}</div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => auth.requireAuth("create_ficha", () => setVac({ id: m.id, nombre: "", proxima: "" }))}><Syringe /> Registrar vacuna</Button>
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
