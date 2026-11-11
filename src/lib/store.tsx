import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Tutor, Mascota, Veterinario, Cita, Ficha, Pago } from "./clinic";
import tSebas from "@/assets/tutor-sebastian.jpg";
import tCamila from "@/assets/tutor-camila.jpg";
import tDiego from "@/assets/tutor-diego.jpg";
import pMax from "@/assets/pet-max.jpg";
import pLuna from "@/assets/pet-luna.jpg";
import pRocky from "@/assets/pet-rocky.jpg";
import pCopito from "@/assets/pet-copito.jpg";
import vMarcelo from "@/assets/vet-marcelo.jpg";
import vPatricia from "@/assets/vet-patricia.jpg";

interface Data {
  tutores: Tutor[];
  mascotas: Mascota[];
  vets: Veterinario[];
  citas: Cita[];
  fichas: Ficha[];
  pagos: Pago[];
}

const d = (offset: number) => {
  const x = new Date();
  x.setDate(x.getDate() + offset);
  return x.toISOString().slice(0, 10);
};

export const seedData = (): Data => ({
  tutores: [
    {
      id: "t1",
      nombre: "Sebastián Torres Zamorano",
      rut: "19.876.543-0",
      email: "sebastian.torres33@inacapmail.cl",
      telefono: "+56 9 9123 4567",
      direccion: "Av. Libertador B. O'Higgins 450, Santiago Centro",
      foto: tSebas,
    },
    {
      id: "t2",
      nombre: "Camila Alarcón Silva",
      rut: "18.765.432-1",
      email: "camila.alarcon@gmail.com",
      telefono: "+56 9 8765 4321",
      direccion: "Av. Las Condes 1020, Santiago",
      foto: tCamila,
    },
    {
      id: "t3",
      nombre: "Diego Fuentes Morales",
      rut: "12.345.678-5",
      email: "diego.fuentes@mail.cl",
      telefono: "+56 9 1234 5678",
      direccion: "Los Leones 455, Providencia",
      foto: tDiego,
    },
  ],
  mascotas: [
    {
      id: "m1",
      tutorId: "t1",
      nombre: "Max",
      especie: "Perro",
      raza: "Golden Retriever",
      nacimiento: "2021-03-14",
      peso: 31,
      foto: pMax,
      vacunas: [
        { nombre: "Antirrábica", fecha: d(-358), proxima: d(7) },
        { nombre: "Óctuple", fecha: d(-200), proxima: d(165) },
      ],
    },
    {
      id: "m2",
      tutorId: "t1",
      nombre: "Luna",
      especie: "Gato",
      raza: "Doméstico pelo corto",
      nacimiento: "2022-07-02",
      peso: 4.2,
      foto: pLuna,
      vacunas: [
        { nombre: "Triple felina", fecha: d(-370), proxima: d(-5) },
      ],
    },
    {
      id: "m3",
      tutorId: "t2",
      nombre: "Rocky",
      especie: "Perro",
      raza: "Bulldog Francés",
      nacimiento: "2024-05-20",
      peso: 9.5,
      foto: pRocky,
      vacunas: [
        { nombre: "Séxtuple (2ª dosis)", fecha: d(-21), proxima: d(3) },
      ],
    },
    {
      id: "m4",
      tutorId: "t3",
      nombre: "Copito",
      especie: "Conejo",
      raza: "Belier Enano",
      nacimiento: "2023-01-10",
      peso: 2.1,
      foto: pCopito,
      vacunas: [
        { nombre: "Mixomatosis", fecha: d(-150), proxima: d(30) },
      ],
    },
  ],
  vets: [
    {
      id: "v1",
      nombre: "Dr. Marcelo Alvarado Aravena",
      especialidad: "Medicina general & Director Clínico",
      inicio: "09:00",
      fin: "18:00",
      dias: [1, 2, 3, 4, 5],
      foto: vMarcelo,
    },
    {
      id: "v2",
      nombre: "Dra. Patricia Soto Mardones",
      especialidad: "Cirugía y traumatología",
      inicio: "10:00",
      fin: "19:00",
      dias: [1, 3, 5, 6],
      foto: vPatricia,
    },
  ],
  citas: [
    { id: "c1", mascotaId: "m1", vetId: "v1", fecha: d(0), hora: "10:00", duracion: 30, motivo: "Control anual", estado: "Confirmada" },
    { id: "c2", mascotaId: "m3", vetId: "v1", fecha: d(0), hora: "11:30", duracion: 30, motivo: "Vacunación preventiva", estado: "Programada" },
    { id: "c3", mascotaId: "m2", vetId: "v2", fecha: d(1), hora: "15:00", duracion: 60, motivo: "Esterilización programada", estado: "Programada" },
    { id: "c4", mascotaId: "m4", vetId: "v1", fecha: d(-2), hora: "09:30", duracion: 30, motivo: "Revisión dental y recorte", estado: "Atendida" },
  ],
  fichas: [
    {
      id: "f1",
      mascotaId: "m1",
      vetId: "v1",
      fecha: d(-25),
      diagnostico: "Otitis externa bacteriana leve",
      tratamiento: "Limpieza auricular bilateral",
      receta: "Otomax gotas c/12h x 7 días",
      examenes: "Citología ótica directa",
      proximoControl: d(10),
    },
    {
      id: "f2",
      mascotaId: "m4",
      vetId: "v1",
      fecha: d(-2),
      diagnostico: "Maloclusión dental incisivos",
      tratamiento: "Limado y nivelación de incisivos",
      receta: "Meloxicam gotas 0.5mg/kg c/24h x 3 días",
      examenes: "Examen dental radiológico",
      proximoControl: d(14),
    },
  ],
  pagos: [
    {
      id: "PC-INIT-1",
      fecha: d(-2),
      concepto: "Consulta + Limado dental · Copito",
      monto: 35000,
      proveedor: "Transbank",
      estado: "Aprobado",
      ref: "TBK-AUT-592810",
    },
    {
      id: "PC-INIT-2",
      fecha: d(-1),
      concepto: "Vacuna antirrábica + Control · Max",
      monto: 25000,
      proveedor: "Transbank",
      estado: "Aprobado",
      ref: "TBK-AUT-481920",
    },
  ],
});

type Ctx = Data & {
  set: <K extends keyof Data>(k: K, v: Data[K]) => void;
  reset: () => void;
};

const C = createContext<Ctx | null>(null);
const STORAGE_KEY = "petcare-data-v4";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(seedData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      // Limpiar versiones anteriores que no tenían a Sebastián Torres o a Marcelo Alvarado
      localStorage.removeItem("petcare-data-v1");
      localStorage.removeItem("petcare-data-v2");
      localStorage.removeItem("petcare-data-v3");

      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Asegurarse de que el tutor 1 sea Sebastián Torres
        if (parsed.tutores && parsed.tutores[0]?.nombre?.includes("Torres")) {
          setData({ ...seedData(), ...parsed });
        } else {
          setData(seedData());
        }
      } else {
        setData(seedData());
      }
    } catch {
      setData(seedData());
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        /* ignorar */
      }
    }
  }, [data, ready]);

  return (
    <C.Provider
      value={{
        ...data,
        set: (k, v) => setData((p) => ({ ...p, [k]: v })),
        reset: () => {
          localStorage.removeItem(STORAGE_KEY);
          setData(seedData());
        },
      }}
    >
      {children}
    </C.Provider>
  );
}

export const useStore = () => {
  const c = useContext(C);
  if (!c) throw new Error("StoreProvider missing");
  return c;
};
