import "server-only";
import type { KategoriRow } from "@/server/models/kategori.model";

export interface KategoriResourceData {
  id: number;
  nama: string;
  warna: string;
  createdAt: string;
  updatedAt: string;
}

export function toKategoriResource(row: KategoriRow): KategoriResourceData {
  return {
    id: row.id,
    nama: row.nama,
    warna: row.warna,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toKategoriCollection(rows: KategoriRow[]): KategoriResourceData[] {
  return rows.map(toKategoriResource);
}
