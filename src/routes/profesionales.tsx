import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/profesionales")({
  head: () => ({ meta: [{ title: "Profesionales · PetCare" }, { name: "description", content: "Disponibilidad horaria de cada veterinario." }, { property: "og:title", content: "Profesionales · PetCare" }, { property: "og:description", content: "Disponibilidad de veterinarios." }] }),
  component: Profesionales,
});
const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function Profesionales() {
  const s = useStore();
  const upd = (id: string, patch: object) => s.set("vets", s.vets.map((v) => v.id === id ? { ...v, ...patch } : v));
  return (
    <>
      <PageHeader title="Profesionales" subtitle="Configura la disponibilidad que usa la agenda" />
      <div className="grid gap-5 lg:grid-cols-2">
        {s.vets.map((v) => (
          <Card key={v.id} className="shadow-card border-0"><CardContent className="flex gap-5 p-5">
            <img src={v.foto} alt={v.nombre} className="size-28 rounded-2xl object-cover" loading="lazy" />
            <div className="flex-1 space-y-3">
              <div><h3 className="text-xl font-semibold">{v.nombre}</h3><p className="text-sm text-muted-foreground">{v.especialidad}</p></div>
              <div className="flex flex-wrap gap-1.5">{DIAS.map((d, i) => (
                <button key={d} onClick={() => upd(v.id, { dias: v.dias.includes(i) ? v.dias.filter((x) => x !== i) : [...v.dias, i] })}>
                  <Badge variant={v.dias.includes(i) ? "default" : "outline"}>{d}</Badge>
                </button>))}</div>
              <div className="flex items-center gap-2 text-sm"><Input type="time" value={v.inicio} onChange={(e) => upd(v.id, { inicio: e.target.value })} className="w-32" />a<Input type="time" value={v.fin} onChange={(e) => upd(v.id, { fin: e.target.value })} className="w-32" /></div>
            </div>
          </CardContent></Card>
        ))}
      </div>
    </>
  );
}
