import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Syringe, Search, Filter, LayoutGrid, Table as TableIcon, Cpu } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader, Field, NativeSelect } from "@/components/page";
import { useStore } from "@/lib/store";
import { uid, type Species } from "@/lib/clinic";

export const Route = createFileRoute("/mascotas")({
  head: () => ({
    meta: [
      { title: "Mascotas y Pacientes · PetCare" },
      { name: "description", content: "Catálogo clínico de mascotas, fichas biométricas y microchips." },
    ],
  }),
  component: Mascotas,
});

const schema = z.object({
  tutorId: z.string().min(1, "Selecciona tutor"),
  nombre: z.string().trim().min(2).max(40),
  especie: z.enum(["Perro", "Gato", "Conejo", "Otro"]),
  raza: z.string().trim().min(2, "Raza requerida").max(60),
  nacimiento: z.string().min(1, "Fecha requerida"),
  peso: z.coerce.number().positive("Peso inválido").max(150),
  color: z.string().optional(),
  sexo: z.enum(["Macho", "Hembra"]).default("Macho"),
  numeroChip: z.string().optional(),
});

const edad = (n: string) => {
  const y = (Date.now() - new Date(n).getTime()) / 31557600000;
  return y < 1 ? `${Math.round(y * 12)} meses` : `${Math.floor(y)} años`;
};

export function Mascotas() {
  const s = useStore();
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [search, setSearch] = useState("");
  const [filterSpecies, setFilterSpecies] = useState("");

  const [f, setF] = useState({
    tutorId: "",
    nombre: "",
    especie: "Perro",
    raza: "",
    nacimiento: "",
    peso: "",
    color: "",
    sexo: "Macho",
    numeroChip: "",
  });

  const [vac, setVac] = useState<{ id: string; nombre: string; proxima: string } | null>(null);

  const save = () => {
    const r = schema.safeParse(f);
    if (!r.success) {
      toast.error(r.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    s.set("mascotas", [
      ...s.mascotas,
      {
        id: uid(),
        ...r.data,
        especie: r.data.especie as Species,
        sexo: r.data.sexo as "Macho" | "Hembra",
        vacunas: [],
      },
    ]);
    setOpen(false);
    toast.success("Mascota registrada");
  };

  const addVac = () => {
    if (!vac || vac.nombre.trim().length < 2 || !vac.proxima) {
      toast.error("Completa vacuna y próxima fecha");
      return;
    }
    s.set(
      "mascotas",
      s.mascotas.map((m) =>
        m.id === vac.id
          ? {
              ...m,
              vacunas: [
                ...m.vacunas,
                {
                  nombre: vac.nombre.trim(),
                  fecha: new Date().toISOString().slice(0, 10),
                  proxima: vac.proxima,
                },
              ],
            }
          : m
      )
    );
    setVac(null);
    toast.success("Vacuna registrada");
  };

  const filteredMascotas = s.mascotas.filter((m) => {
    const tutor = s.tutores.find((t) => t.id === m.tutorId);
    const textMatch =
      m.nombre.toLowerCase().includes(search.toLowerCase()) ||
      m.raza.toLowerCase().includes(search.toLowerCase()) ||
      (m.numeroChip && m.numeroChip.includes(search)) ||
      (tutor && tutor.nombre.toLowerCase().includes(search.toLowerCase()));

    const speciesMatch =
      !filterSpecies ||
      (filterSpecies === "CANINO" && m.especie === "Perro") ||
      (filterSpecies === "FELINO" && m.especie === "Gato") ||
      (filterSpecies === "ROEDOR" && m.especie === "Conejo") ||
      (filterSpecies === m.especie);

    return textMatch && speciesMatch;
  });

  return (
    <>
      <PageHeader
        title="Mascotas"
        subtitle="Catálogo clínico de pacientes, fichas biométricas y microchips"
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border bg-card p-1">
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewMode("table")}
              >
                <TableIcon className="size-4" />
              </Button>
              <Button
                variant={viewMode === "cards" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewMode("cards")}
              >
                <LayoutGrid className="size-4" />
              </Button>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2 shadow-sm">
                  <Plus className="size-4" /> Ingresar Paciente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Registrar nuevo paciente</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3">
                  <Field label="Tutor Responsable">
                    <NativeSelect
                      value={f.tutorId}
                      onChange={(e) => setF({ ...f, tutorId: e.target.value })}
                    >
                      <option value="">Seleccionar tutor…</option>
                      {s.tutores.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nombre} ({t.rut})
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Nombre">
                      <Input
                        value={f.nombre}
                        onChange={(e) => setF({ ...f, nombre: e.target.value })}
                        placeholder="Ej. Copito"
                      />
                    </Field>
                    <Field label="Color / Patrón">
                      <Input
                        value={f.color}
                        onChange={(e) => setF({ ...f, color: e.target.value })}
                        placeholder="Ej. Gris Jaspeado"
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Especie">
                      <NativeSelect
                        value={f.especie}
                        onChange={(e) => setF({ ...f, especie: e.target.value })}
                      >
                        <option value="Perro">Canino (Perro)</option>
                        <option value="Gato">Felino (Gato)</option>
                        <option value="Conejo">Roedor / Conejo</option>
                        <option value="Otro">Otro</option>
                      </NativeSelect>
                    </Field>
                    <Field label="Sexo">
                      <NativeSelect
                        value={f.sexo}
                        onChange={(e) => setF({ ...f, sexo: e.target.value })}
                      >
                        <option value="Macho">♂ Macho</option>
                        <option value="Hembra">♀ Hembra</option>
                      </NativeSelect>
                    </Field>
                    <Field label="Peso (Kg)">
                      <Input
                        type="number"
                        step="0.01"
                        value={f.peso}
                        onChange={(e) => setF({ ...f, peso: e.target.value })}
                        placeholder="1.60"
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Raza">
                      <Input
                        value={f.raza}
                        onChange={(e) => setF({ ...f, raza: e.target.value })}
                        placeholder="Ej. Belier Enano"
                      />
                    </Field>
                    <Field label="N° Microchip">
                      <Input
                        value={f.numeroChip}
                        onChange={(e) => setF({ ...f, numeroChip: e.target.value })}
                        placeholder="990000001005"
                      />
                    </Field>
                  </div>
                  <Field label="Fecha de Nacimiento">
                    <Input
                      type="date"
                      value={f.nacimiento}
                      onChange={(e) => setF({ ...f, nacimiento: e.target.value })}
                    />
                  </Field>
                  <Button onClick={save} className="bg-emerald-700 hover:bg-emerald-800 text-white mt-2">
                    Guardar Paciente
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* BARRA DE BÚSQUEDA Y FILTRADO EXACTA A LA DEL SCREENSHOT */}
      <Card className="border-0 shadow-card mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por Nombre mascota, N° Chip o Tutor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <div className="w-full sm:w-56">
              <NativeSelect
                value={filterSpecies}
                onChange={(e) => setFilterSpecies(e.target.value)}
                className="bg-background"
              >
                <option value="">Todas las Especies</option>
                <option value="CANINO">Canino (Perro)</option>
                <option value="FELINO">Felino (Gato)</option>
                <option value="ROEDOR">Roedor / Conejo</option>
              </NativeSelect>
            </div>
            <Button
              variant="default"
              className="bg-emerald-700 hover:bg-emerald-800 text-white w-full sm:w-auto px-6 gap-2"
              onClick={() => {}}
            >
              <Filter className="size-4" /> Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* VISTA 1: TABLA EXACTA DEL SCREENSHOT */}
      {viewMode === "table" ? (
        <Card className="border-0 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-4">Foto</th>
                  <th className="py-3 px-4">Nombre Paciente</th>
                  <th className="py-3 px-4">Especie & Raza</th>
                  <th className="py-3 px-4">Sexo</th>
                  <th className="py-3 px-4">Edad</th>
                  <th className="py-3 px-4">Peso Actual</th>
                  <th className="py-3 px-4">N° Microchip</th>
                  <th className="py-3 px-4">Tutor Responsable</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {filteredMascotas.map((m) => {
                  const tutor = s.tutores.find((t) => t.id === m.tutorId);
                  const isRoedor = m.especie === "Conejo";
                  const isFelino = m.especie === "Gato";
                  const isCanino = m.especie === "Perro";

                  return (
                    <tr key={m.id} className="hover:bg-muted/30 transition">
                      {/* FOTO CON SU ICONO VECTORIAL EXACTO */}
                      <td className="py-3 px-4">
                        <img
                          src={m.foto}
                          alt={m.nombre}
                          className="size-12 rounded-2xl object-cover shadow-sm border"
                          loading="lazy"
                        />
                      </td>

                      {/* NOMBRE PACIENTE */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-base text-foreground">{m.nombre}</p>
                        <p className="text-xs text-muted-foreground">{m.color || "—"}</p>
                      </td>

                      {/* ESPECIE Y RAZA CON BADGES PASTEL */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-1 ${
                            isRoedor
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : isFelino
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {isRoedor
                            ? "Roedor / Conejo"
                            : isFelino
                            ? "Felino (Gato)"
                            : "Canino (Perro)"}
                        </span>
                        <p className="text-xs text-muted-foreground">{m.raza}</p>
                      </td>

                      {/* SEXO */}
                      <td className="py-3 px-4 font-semibold text-xs">
                        {m.sexo === "Hembra" ? (
                          <span className="text-pink-600 flex items-center gap-1">
                            ♀ Hembra
                          </span>
                        ) : (
                          <span className="text-blue-600 flex items-center gap-1">
                            ♂ Macho
                          </span>
                        )}
                      </td>

                      {/* EDAD */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-xs">{edad(m.nacimiento)}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {m.nacimiento}
                        </p>
                      </td>

                      {/* PESO ACTUAL */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-muted text-xs font-mono font-medium">
                          {m.peso.toFixed(2).replace(".", ",")} Kg
                        </span>
                      </td>

                      {/* N° MICROCHIP */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-white font-mono text-xs">
                          <Cpu className="size-3 text-cyan-400" />
                          {m.numeroChip || "990000001000"}
                        </span>
                      </td>

                      {/* TUTOR RESPONSABLE */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-xs text-foreground">
                          {tutor?.nombre ?? "Sebastián Torres"}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {tutor?.telefono ?? "+56 9 9123 4567"}
                        </p>
                      </td>

                      {/* ACCIONES */}
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 text-xs"
                          onClick={() =>
                            setVac({
                              id: m.id,
                              nombre: "",
                              proxima: new Date().toISOString().slice(0, 10),
                            })
                          }
                        >
                          <Syringe className="size-3 text-primary" />
                          Vacuna
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* VISTA 2: TARJETAS GRID */
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredMascotas.map((m) => {
            const tutor = s.tutores.find((t) => t.id === m.tutorId);
            return (
              <Card key={m.id} className="border-0 shadow-card overflow-hidden">
                <div className="p-4 flex gap-4 items-center border-b bg-muted/20">
                  <img
                    src={m.foto}
                    alt={m.nombre}
                    className="size-16 rounded-2xl object-cover shadow-sm border"
                  />
                  <div>
                    <h3 className="text-xl font-bold">{m.nombre}</h3>
                    <p className="text-xs text-muted-foreground">{m.color || m.raza}</p>
                    <Badge variant="secondary" className="mt-1 text-[10px]">
                      {m.especie} · {m.sexo || "Macho"}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Raza:</span>
                    <span className="font-medium">{m.raza}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Edad / Peso:</span>
                    <span className="font-medium">{edad(m.nacimiento)} · {m.peso} kg</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Microchip:</span>
                    <span className="font-mono">{m.numeroChip || "—"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Tutor:</span>
                    <span className="font-bold text-primary">{tutor?.nombre}</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 h-8 gap-1.5 text-xs"
                    onClick={() =>
                      setVac({
                        id: m.id,
                        nombre: "",
                        proxima: new Date().toISOString().slice(0, 10),
                      })
                    }
                  >
                    <Syringe className="size-3.5 text-primary" /> Registrar vacuna
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL REGISTRAR VACUNA */}
      {vac && (
        <Dialog open={!!vac} onOpenChange={(o) => !o && setVac(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar vacuna médica</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <Field label="Nombre de la vacuna">
                <Input
                  value={vac.nombre}
                  onChange={(e) => setVac({ ...vac, nombre: e.target.value })}
                  placeholder="Ej. Antirrábica / Óctuple / Triple felina"
                />
              </Field>
              <Field label="Próxima dosis (genera recordatorio)">
                <Input
                  type="date"
                  value={vac.proxima}
                  onChange={(e) => setVac({ ...vac, proxima: e.target.value })}
                />
              </Field>
              <Button onClick={addVac} className="bg-emerald-700 hover:bg-emerald-800 text-white">
                Guardar en Carnet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
export default Mascotas;
