import "server-only";
import type { VideoRow } from "@/server/models/video.model";

export interface VideoResourceData {
  id: number;
  judul: string;
  url: string;
  urutan: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toVideoResource(row: VideoRow): VideoResourceData {
  return {
    id: row.id,
    judul: row.judul,
    url: row.url,
    urutan: row.urutan,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toVideoCollection(rows: VideoRow[]): VideoResourceData[] {
  return rows.map(toVideoResource);
}
