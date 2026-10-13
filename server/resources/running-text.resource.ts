import "server-only";
import type { RunningTextRow } from "@/server/models/running-text.model";

export interface RunningTextResourceData {
  id: number;
  isi: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toRunningTextResource(row: RunningTextRow): RunningTextResourceData {
  return {
    id: row.id,
    isi: row.isi,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toRunningTextCollection(rows: RunningTextRow[]): RunningTextResourceData[] {
  return rows.map(toRunningTextResource);
}
