import "server-only";
import type {
  PengumumanRow,
  PengumumanWithKategoriRow,
} from "@/server/models/pengumuman.model";

export interface PengumumanResourceData {
  id: number;
  judul: string;
  tanggal: string;
  kategoriId: number | null;
  isActive: boolean;
  kategoriNama: string | null;
  kategoriWarna: string | null;
  kategori: {
    id: number;
    nama: string;
    warna: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export function toPengumumanResource(
  row: PengumumanWithKategoriRow | PengumumanRow
): PengumumanResourceData {
  const hasKategoriData = "kategoriNama" in row && row.kategoriNama !== null;

  return {
    id: row.id,
    judul: row.judul,
    tanggal: row.tanggal,
    kategoriId: row.kategoriId,
    isActive: row.isActive,
    kategoriNama: "kategoriNama" in row ? row.kategoriNama : null,
    kategoriWarna: "kategoriWarna" in row ? row.kategoriWarna : null,
    kategori:
      hasKategoriData && row.kategoriId
        ? {
            id: row.kategoriId,
            nama: (row as PengumumanWithKategoriRow).kategoriNama!,
            warna: (row as PengumumanWithKategoriRow).kategoriWarna || "#059669",
          }
        : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toPengumumanCollection(
  rows: (PengumumanWithKategoriRow | PengumumanRow)[]
): PengumumanResourceData[] {
  return rows.map(toPengumumanResource);
}
