import "server-only";
import type { MakroEkonomiRow, MakroTren } from "@/server/models/makro-ekonomi.model";
import type { GrafikMakroMulti } from "@/lib/makro-ekonomi";

export interface MakroEkonomiResourceData {
  id: number;
  regionId: number;
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
    regionId: row.regionId,
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

export type GrafikMakroMultiResourceData = GrafikMakroMulti | null;

export function toGrafikMakroMultiResource(
  data: GrafikMakroMulti | null
): GrafikMakroMultiResourceData {
  return data;
}
