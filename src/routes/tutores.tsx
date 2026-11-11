import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Mail, Phone, MapPin, Trash2, Upload, Sparkles, X, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader, Field } from "@/components/page";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
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

const PRESET_TUTOR_AVATARS = [
  { label: "👩‍💼 Camila", url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80" },
  { label: "👨‍💻 Diego", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80" },
  { label: "👩‍⚕️ Dra. Soto", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80" },
  { label: "👨‍🏫 Prof. Marcelo", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80" },
  { label: "🧑‍🎓 Sebastián", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80" },
];

function Tutores() {
  const s = useStore();
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [f, setF] = useState({ nombre: "", rut: "", email: "", telefono: "", direccion: "", foto: "" });

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
        toast.success("Foto de avatar cargada");
      }
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    const r = schema.safeParse(f);
    if (!r.success) { toast.error(r.error.issues[0]?.message ?? "Datos inválidos"); return; }
    if (s.tutores.some((t) => t.rut.replace(/\D/g, "") === r.data.rut.replace(/\D/g, ""))) { toast.error("Ya existe un tutor con ese RUT"); return; }
    const fotoFinal = f.foto.trim() || undefined;
    const nuevoTutor = { id: uid(), ...r.data, foto: fotoFinal };
    s.set("tutores", [...s.tutores, nuevoTutor]);
    setOpen(false);
    setF({ nombre: "", rut: "", email: "", telefono: "", direccion: "", foto: "" });
    toast.success(`Tutor "${nuevoTutor.nombre}" registrado exitosamente`);

    // Sincronización asíncrona hacia Django REST Framework (PostgreSQL)
    try {
      await fetch("/api/tutores/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rut: nuevoTutor.rut,
          nombre_completo: nuevoTutor.nombre,
          email: nuevoTutor.email,
          telefono: nuevoTutor.telefono,
          direccion: nuevoTutor.direccion,
          foto_url: nuevoTutor.foto ?? "",
        }),
      });
    } catch {
      // Ignorar fallo offline
    }
  };

  const list = s.tutores.filter((t) => (t.nombre + t.rut).toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader title="Tutores" subtitle="Responsables y dueños de cada paciente" action={
        <Dialog open={open} onOpenChange={setOpen}>
          <Button onClick={() => auth.requireAuth("create_tutor", () => setOpen(true))}><Plus /> Nuevo tutor</Button>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Registrar nuevo tutor</DialogTitle></DialogHeader>
            <div className="grid gap-3 pt-2">
              {(["nombre", "rut", "email", "telefono", "direccion"] as const).map((k) => (
                <Field key={k} label={k === "nombre" ? "Nombre Completo" : k === "rut" ? "RUT (con guión y dígito)" : k.charAt(0).toUpperCase() + k.slice(1)}>
                  <Input
                    value={f[k]}
                    onChange={(e) => setF({ ...f, [k]: e.target.value })}
                    placeholder={k === "rut" ? "12.345.678-5" : k === "telefono" ? "+56 9 1234 5678" : ""}
                  />
                </Field>
              ))}

              {/* Selector de Avatar / Foto */}
              <div className="rounded-xl border bg-muted/30 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold flex items-center gap-1.5">
                    <User className="size-3.5 text-primary" /> Foto de Perfil / Avatar
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
                  <div className="relative mx-auto size-24 overflow-hidden rounded-2xl border-2 border-primary shadow-sm">
                    <img src={f.foto} alt="Avatar" className="size-full object-cover" />
                  </div>
                ) : (
                  <div className="grid place-items-center rounded-lg border border-dashed py-3 text-center">
                    <Upload className="size-6 text-muted-foreground/60 mb-1" />
                    <p className="text-[11px] text-muted-foreground">Sube un avatar o selecciona un preset rápido</p>
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
                    placeholder="O pega URL de foto..."
                    value={f.foto?.startsWith("data:") ? "" : f.foto}
                    onChange={(e) => setF({ ...f, foto: e.target.value })}
                    className="flex-[2] text-xs h-8"
                  />
                </div>

                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                    <Sparkles className="size-2.5 text-amber-500" /> Avatares predefinidos:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {PRESET_TUTOR_AVATARS.map((p) => (
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

              <Button onClick={save} className="w-full mt-1">Guardar Tutor</Button>
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
                <Button variant="ghost" size="icon" aria-label="Eliminar" onClick={() => {
                  auth.requireAuth("delete_tutor", () => {
                    if (pets.length) { toast.error("Tiene mascotas asociadas"); return; }
                    s.set("tutores", s.tutores.filter((x) => x.id !== t.id));
                    toast.success(`Tutor "${t.nombre}" eliminado`);
                  });
                }}><Trash2 /></Button>
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
