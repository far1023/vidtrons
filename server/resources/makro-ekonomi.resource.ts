import "server-only";
import type { MakroEkonomiRow, MakroTren } from "@/server/models/makro-ekonomi.model";

export interface MakroEkonomiResourceData {
  id: number;
  judul: string;
  nilai: string;
  satuan: string;
  tahun: string;
  tren: MakroTren;
  urutan: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toMakroEkonomiResource(
  row: MakroEkonomiRow
): MakroEkonomiResourceData {
  return {
    id: row.id,
    judul: row.judul,
    nilai: row.nilai,
    satuan: row.satuan,
    tahun: row.tahun,
    tren: (row.tren as MakroTren) || "tetap",
    urutan: row.urutan,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toMakroEkonomiCollection(
  rows: MakroEkonomiRow[]
): MakroEkonomiResourceData[] {
  return rows.map(toMakroEkonomiResource);
}
