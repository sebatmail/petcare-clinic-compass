// Pure clinic business rules (tested in src/test/clinic.test.ts)
export type Species = "Perro" | "Gato" | "Conejo" | "Otro";
export interface Tutor { id: string; nombre: string; rut: string; email: string; telefono: string; direccion: string; foto?: string }
export interface Vacuna { nombre: string; fecha: string; proxima: string }
export interface Mascota {
  id: string;
  tutorId: string;
  nombre: string;
  especie: Species;
  raza: string;
  nacimiento: string;
  peso: number;
  foto?: string;
  vacunas: Vacuna[];
  color?: string;
  sexo?: "Macho" | "Hembra";
  numeroChip?: string;
}
export interface Veterinario { id: string; nombre: string; especialidad: string; inicio: string; fin: string; dias: number[]; foto?: string }
export type EstadoCita = "Programada" | "Confirmada" | "Atendida" | "Cancelada";
export interface Cita { id: string; mascotaId: string; vetId: string; fecha: string; hora: string; duracion: number; motivo: string; estado: EstadoCita }
export interface Ficha { id: string; mascotaId: string; vetId: string; fecha: string; diagnostico: string; tratamiento: string; receta: string; examenes: string; proximoControl?: string | undefined }
export interface Pago { id: string; fecha: string; concepto: string; monto: number; proveedor: string; estado: "Pendiente" | "Aprobado" | "Rechazado"; ref?: string | undefined }

const toMin = (h: string) => { const [a, b] = h.split(":").map(Number); return (a ?? 0) * 60 + (b ?? 0); };

/** Validates a new appointment: vet working day/hours and no overlap with that vet's active appointments. */
export function validarCita(c: Omit<Cita, "id" | "estado">, vet: Veterinario | undefined, citas: Cita[]): string | null {
  if (!vet) return "Selecciona un profesional";
  const dia = new Date(c.fecha + "T12:00:00").getDay();
  if (!vet.dias.includes(dia)) return `${vet.nombre} no atiende ese día`;
  const ini = toMin(c.hora), fin = ini + c.duracion;
  if (ini < toMin(vet.inicio) || fin > toMin(vet.fin)) return `Fuera del horario de ${vet.nombre} (${vet.inicio}–${vet.fin})`;
  const choque = citas.some((x) => x.vetId === c.vetId && x.fecha === c.fecha && x.estado !== "Cancelada" &&
    ini < toMin(x.hora) + x.duracion && toMin(x.hora) < fin);
  if (choque) return "Horario ya ocupado para este profesional";
  return null;
}

export type Recordatorio = { mascotaId: string; tipo: "Vacuna" | "Control"; detalle: string; fecha: string; dias: number };

/** Reminders due within `ventana` days (overdue included, negative dias). */
export function recordatoriosPendientes(mascotas: Mascota[], fichas: Ficha[], hoy: Date, ventana = 30): Recordatorio[] {
  const d0 = new Date(hoy.toISOString().slice(0, 10) + "T00:00:00").getTime();
  const diff = (f: string) => Math.round((new Date(f + "T00:00:00").getTime() - d0) / 86400000);
  const out: Recordatorio[] = [];
  for (const m of mascotas) for (const v of m.vacunas) { const d = diff(v.proxima); if (d <= ventana) out.push({ mascotaId: m.id, tipo: "Vacuna", detalle: v.nombre, fecha: v.proxima, dias: d }); }
  for (const f of fichas) if (f.proximoControl) { const d = diff(f.proximoControl); if (d <= ventana) out.push({ mascotaId: f.mascotaId, tipo: "Control", detalle: f.diagnostico, fecha: f.proximoControl, dias: d }); }
  return out.sort((a, b) => a.dias - b.dias);
}

export function validarRut(rut: string): boolean {
  const clean = rut.replace(/[.\-\s]/g, "").toUpperCase();
  if (!/^\d{7,8}[\dK]$/.test(clean)) return false;
  const body = clean.slice(0, -1), dv = clean.slice(-1);
  let sum = 0, mul = 2;
  for (let i = body.length - 1; i >= 0; i--) { sum += Number(body[i]) * mul; mul = mul === 7 ? 2 : mul + 1; }
  const r = 11 - (sum % 11);
  return dv === (r === 11 ? "0" : r === 10 ? "K" : String(r));
}

export const uid = () => Math.random().toString(36).slice(2, 10);
export const clp = (n: number) => n.toLocaleString("es-CL", { style: "currency", currency: "CLP" });
