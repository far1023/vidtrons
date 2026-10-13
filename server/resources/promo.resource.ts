import "server-only";
import type { PromoRow } from "@/server/models/promo.model";

export interface PromoResourceData {
  id: number;
  judul: string;
  gambarUrl: string;
  urutan: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toPromoResource(row: PromoRow): PromoResourceData {
  return {
    id: row.id,
    judul: row.judul,
    gambarUrl: row.gambarUrl,
    urutan: row.urutan,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toPromoCollection(rows: PromoRow[]): PromoResourceData[] {
  return rows.map(toPromoResource);
}
