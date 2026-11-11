import { describe, expect, it } from "vitest";
import { validarCita, recordatoriosPendientes, validarRut, type Veterinario, type Cita } from "@/lib/clinic";

const vet: Veterinario = { id: "v1", nombre: "Dra. X", especialidad: "", inicio: "09:00", fin: "18:00", dias: [1, 2, 3, 4, 5] };
const base: Cita[] = [{ id: "c1", mascotaId: "m1", vetId: "v1", fecha: "2026-11-11", hora: "10:00", duracion: 30, motivo: "", estado: "Programada" }];

describe("agenda", () => {
  it("rechaza solapamiento con el mismo profesional", () => {
    expect(validarCita({ mascotaId: "m2", vetId: "v1", fecha: "2026-11-11", hora: "10:15", duracion: 30, motivo: "" }, vet, base)).toMatch(/ocupado/);
  });
  it("permite la hora contigua", () => {
    expect(validarCita({ mascotaId: "m2", vetId: "v1", fecha: "2026-11-11", hora: "10:30", duracion: 30, motivo: "" }, vet, base)).toBeNull();
  });
  it("rechaza fuera de horario y días no laborales", () => {
    expect(validarCita({ mascotaId: "m2", vetId: "v1", fecha: "2026-11-11", hora: "17:45", duracion: 30, motivo: "" }, vet, base)).toMatch(/Fuera/);
    expect(validarCita({ mascotaId: "m2", vetId: "v1", fecha: "2026-11-15", hora: "10:00", duracion: 30, motivo: "" }, vet, base)).toMatch(/no atiende/);
  });
});

describe("recordatorios y rut", () => {
  it("incluye vacunas dentro de 30 días y excluye las lejanas", () => {
    const m = [{ id: "m1", tutorId: "t", nombre: "A", especie: "Perro" as const, raza: "", nacimiento: "", peso: 1,
      vacunas: [{ nombre: "Rabia", fecha: "", proxima: "2026-11-20" }, { nombre: "Óctuple", fecha: "", proxima: "2027-05-01" }] }];
    const r = recordatoriosPendientes(m, [], new Date("2026-11-11T12:00:00Z"));
    expect(r.map((x) => x.detalle)).toEqual(["Rabia"]);
    expect(r[0].dias).toBe(9);
  });
  it("valida RUT chileno", () => {
    expect(validarRut("11.111.111-1")).toBe(true);
    expect(validarRut("11.111.111-2")).toBe(false);
  });
});
