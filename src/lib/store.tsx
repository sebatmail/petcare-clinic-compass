import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Tutor, Mascota, Veterinario, Cita, Ficha, Pago } from "./clinic";

// Vector illustrations matching the exact clinical design
import pCopito from "@/assets/pet-copito.svg";
import pLuna from "@/assets/pet-luna.svg";
import pMisi from "@/assets/pet-misi.svg";
import pRocky from "@/assets/pet-rocky.svg";
import pThor from "@/assets/pet-thor.svg";

import tSebas from "@/assets/tutor-sebastian.svg";
import tCamila from "@/assets/tutor-camila.svg";
import tMaria from "@/assets/tutor-maria.svg";
import tJuan from "@/assets/tutor-juan.svg";

import vMarcelo from "@/assets/vet-marcelo.svg";
import vPatricia from "@/assets/vet-patricia.svg";

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
      direccion: "Av. Libertador B. O'Higgins 450, Santiago",
      foto: tSebas,
    },
    {
      id: "t2",
      nombre: "Camila Alarcón Silva",
      rut: "18.765.432-1",
      email: "camila.alarcon@gmail.com",
      telefono: "+56 9 8234 5678",
      direccion: "Av. Las Condes 1020, Las Condes",
      foto: tCamila,
    },
    {
      id: "t3",
      nombre: "María Rodríguez Pérez",
      rut: "17.654.321-K",
      email: "maria.rodriguez@hotmail.com",
      telefono: "+56 9 7345 6789",
      direccion: "Av. Providencia 2340, Providencia",
      foto: tMaria,
    },
    {
      id: "t4",
      nombre: "Juan Pablo Valenzuela",
      rut: "16.543.210-9",
      email: "jp.valenzuela@outlook.com",
      telefono: "+56 9 6456 7890",
      direccion: "Gran Avenida 5600, San Miguel",
      foto: tJuan,
    },
  ],
  mascotas: [
    {
      id: "m1",
      tutorId: "t4",
      nombre: "Copito",
      especie: "Conejo",
      raza: "Conejo Belier Enano",
      color: "Gris Jaspeado",
      sexo: "Macho",
      nacimiento: "2023-06-01",
      peso: 1.6,
      numeroChip: "990000001005",
      foto: pCopito,
      vacunas: [
        { nombre: "Mixomatosis", fecha: d(-150), proxima: d(30) },
      ],
    },
    {
      id: "m2",
      tutorId: "t1",
      nombre: "Luna",
      especie: "Gato",
      raza: "Siamés",
      color: "Seal Point",
      sexo: "Hembra",
      nacimiento: "2022-08-20",
      peso: 3.8,
      numeroChip: "990000001002",
      foto: pLuna,
      vacunas: [
        { nombre: "Triple felina", fecha: d(-370), proxima: d(-5) },
      ],
    },
    {
      id: "m3",
      tutorId: "t3",
      nombre: "Misi",
      especie: "Gato",
      raza: "Persa Angora",
      color: "Blanco Puro",
      sexo: "Hembra",
      nacimiento: "2023-01-15",
      peso: 4.1,
      numeroChip: "990000001004",
      foto: pMisi,
      vacunas: [
        { nombre: "Triple felina", fecha: d(-180), proxima: d(120) },
      ],
    },
    {
      id: "m4",
      tutorId: "t1",
      nombre: "Rocky",
      especie: "Perro",
      raza: "Golden Retriever",
      color: "Dorado Claro",
      sexo: "Macho",
      nacimiento: "2021-04-10",
      peso: 28.5,
      numeroChip: "990000001001",
      foto: pRocky,
      vacunas: [
        { nombre: "Antirrábica", fecha: d(-358), proxima: d(7) },
        { nombre: "Óctuple", fecha: d(-200), proxima: d(165) },
      ],
    },
    {
      id: "m5",
      tutorId: "t2",
      nombre: "Thor",
      especie: "Perro",
      raza: "Pastor Alemán",
      color: "Negro Fuego",
      sexo: "Macho",
      nacimiento: "2020-11-05",
      peso: 34.0,
      numeroChip: "990000001003",
      foto: pThor,
      vacunas: [
        { nombre: "Séxtuple", fecha: d(-21), proxima: d(3) },
      ],
    },
  ],
  vets: [
    {
      id: "v1",
      nombre: "Dr. Marcelo Alvarado Aravena",
      especialidad: "Medicina General & Director Clínico",
      inicio: "09:00",
      fin: "18:00",
      dias: [1, 2, 3, 4, 5],
      foto: vMarcelo,
    },
    {
      id: "v2",
      nombre: "Dra. Patricia Soto Mardones",
      especialidad: "Cirugía y Traumatología",
      inicio: "10:00",
      fin: "19:00",
      dias: [1, 3, 5, 6],
      foto: vPatricia,
    },
  ],
  citas: [
    { id: "c1", mascotaId: "m4", vetId: "v1", fecha: d(0), hora: "10:00", duracion: 30, motivo: "Consulta general y decaimiento", estado: "Confirmada" },
    { id: "c2", mascotaId: "m5", vetId: "v1", fecha: d(0), hora: "11:30", duracion: 30, motivo: "Vacunación anual", estado: "Programada" },
    { id: "c3", mascotaId: "m2", vetId: "v2", fecha: d(1), hora: "15:00", duracion: 60, motivo: "Control dermatológico", estado: "Programada" },
    { id: "c4", mascotaId: "m1", vetId: "v1", fecha: d(-2), hora: "09:30", duracion: 30, motivo: "Revisión dental y limado", estado: "Atendida" },
  ],
  fichas: [
    {
      id: "f1",
      mascotaId: "m4",
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
      mascotaId: "m1",
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
      concepto: "Vacuna antirrábica + Control · Rocky",
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
const STORAGE_KEY = "petcare-data-v5";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(seedData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      // Limpiar versiones viejas de prueba
      localStorage.removeItem("petcare-data-v1");
      localStorage.removeItem("petcare-data-v2");
      localStorage.removeItem("petcare-data-v3");
      localStorage.removeItem("petcare-data-v4");

      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.mascotas && parsed.mascotas.some((m: Mascota) => m.nombre === "Copito")) {
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
