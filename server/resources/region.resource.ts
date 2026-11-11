import "server-only";
import type { RegionRow, RegionLevel } from "@/server/models/region.model";

export interface RegionResourceData {
  id: number;
  kode: string;
  nama: string;
  level: RegionLevel;
  parentId: number | null;
  /** Stored color, or null when the region falls back to the palette. */
  warna: string | null;
  isActive: boolean;
}

export function toRegionResource(row: RegionRow): RegionResourceData {
  return {
    id: row.id,
    kode: row.kode,
    nama: row.nama,
    level: row.level as RegionLevel,
    parentId: row.parentId,
    warna: row.warna,
    isActive: row.isActive,
  };
}

export function toRegionCollection(rows: RegionRow[]): RegionResourceData[] {
  return rows.map(toRegionResource);
}

