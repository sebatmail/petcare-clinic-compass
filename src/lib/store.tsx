import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Tutor, Mascota, Veterinario, Cita, Ficha, Pago } from "./clinic";
import tCamila from "@/assets/tutor-camila.jpg";
import tDiego from "@/assets/tutor-diego.jpg";
import pMax from "@/assets/pet-max.jpg";
import pLuna from "@/assets/pet-luna.jpg";
import pRocky from "@/assets/pet-rocky.jpg";
import pCopito from "@/assets/pet-copito.jpg";
import vVal from "@/assets/vet-valentina.jpg";
import vRod from "@/assets/vet-rodrigo.jpg";

interface Data { tutores: Tutor[]; mascotas: Mascota[]; vets: Veterinario[]; citas: Cita[]; fichas: Ficha[]; pagos: Pago[] }
const d = (offset: number) => { const x = new Date(); x.setDate(x.getDate() + offset); return x.toISOString().slice(0, 10); };

const seed = (): Data => ({
  tutores: [
    { id: "t1", nombre: "Camila Rojas", rut: "16.543.210-7", email: "camila.rojas@mail.cl", telefono: "+56 9 8765 4321", direccion: "Av. Providencia 1234, Santiago", foto: tCamila },
    { id: "t2", nombre: "Diego Fuentes", rut: "12.345.678-5", email: "diego.fuentes@mail.cl", telefono: "+56 9 1234 5678", direccion: "Los Leones 455, Ñuñoa", foto: tDiego },
  ],
  mascotas: [
    { id: "m1", tutorId: "t1", nombre: "Max", especie: "Perro", raza: "Golden Retriever", nacimiento: "2021-03-14", peso: 31, foto: pMax, vacunas: [{ nombre: "Antirrábica", fecha: d(-358), proxima: d(7) }, { nombre: "Óctuple", fecha: d(-200), proxima: d(165) }] },
    { id: "m2", tutorId: "t1", nombre: "Luna", especie: "Gato", raza: "Doméstico pelo corto", nacimiento: "2022-07-02", peso: 4.2, foto: pLuna, vacunas: [{ nombre: "Triple felina", fecha: d(-370), proxima: d(-5) }] },
    { id: "m3", tutorId: "t2", nombre: "Rocky", especie: "Perro", raza: "Bulldog Francés", nacimiento: "2025-05-20", peso: 9.5, foto: pRocky, vacunas: [{ nombre: "Séxtuple (2ª dosis)", fecha: d(-21), proxima: d(3) }] },
    { id: "m4", tutorId: "t2", nombre: "Copito", especie: "Conejo", raza: "Belier", nacimiento: "2023-01-10", peso: 2.1, foto: pCopito, vacunas: [{ nombre: "Mixomatosis", fecha: d(-150), proxima: d(30) }] },
  ],
  vets: [
    { id: "v1", nombre: "Dra. Valentina Soto", especialidad: "Medicina general", inicio: "09:00", fin: "18:00", dias: [1, 2, 3, 4, 5], foto: vVal },
    { id: "v2", nombre: "Dr. Rodrigo Pérez", especialidad: "Cirugía y traumatología", inicio: "10:00", fin: "19:00", dias: [1, 3, 5, 6], foto: vRod },
  ],
  citas: [
    { id: "c1", mascotaId: "m1", vetId: "v1", fecha: d(0), hora: "10:00", duracion: 30, motivo: "Control anual", estado: "Confirmada" },
    { id: "c2", mascotaId: "m3", vetId: "v1", fecha: d(0), hora: "11:30", duracion: 30, motivo: "Vacunación", estado: "Programada" },
    { id: "c3", mascotaId: "m2", vetId: "v2", fecha: d(1), hora: "15:00", duracion: 60, motivo: "Esterilización", estado: "Programada" },
    { id: "c4", mascotaId: "m4", vetId: "v1", fecha: d(-2), hora: "09:30", duracion: 30, motivo: "Revisión dental", estado: "Atendida" },
  ],
  fichas: [
    { id: "f1", mascotaId: "m4", vetId: "v1", fecha: d(-2), diagnostico: "Maloclusión dental leve", tratamiento: "Limado de incisivos", receta: "Meloxicam 0,5 mg/kg c/24h x 3 días", examenes: "Examen oral", proximoControl: d(12) },
    { id: "f2", mascotaId: "m1", vetId: "v2", fecha: d(-40), diagnostico: "Otitis externa", tratamiento: "Limpieza auricular", receta: "Otomax gotas c/12h x 7 días", examenes: "Citología ótica" },
  ],
  pagos: [
    { id: "p1", fecha: d(-2), concepto: "Consulta + limado dental · Copito", monto: 35000, proveedor: "Transbank", estado: "Aprobado", ref: "TBK-DEMO-1" },
    { id: "p2", fecha: d(-1), concepto: "Vacuna antirrábica · Max", monto: 18000, proveedor: "Mercado Pago", estado: "Aprobado", ref: "MP-DEMO-2" },
  ],
});

type Ctx = Data & { set: <K extends keyof Data>(k: K, v: Data[K]) => void; reset: () => void };
const C = createContext<Ctx | null>(null);
const KEY = "petcare-data-v1";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(seed);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setData({ ...seed(), ...JSON.parse(raw) }); } catch { /* ignore corrupt */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(data)); }, [data, ready]);
  return <C.Provider value={{ ...data, set: (k, v) => setData((p) => ({ ...p, [k]: v })), reset: () => setData(seed()) }}>{children}</C.Provider>;
}
export const useStore = () => { const c = useContext(C); if (!c) throw new Error("StoreProvider missing"); return c; };
