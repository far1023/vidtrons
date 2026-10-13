import "server-only";
import type { AgendaRow } from "@/server/models/agenda.model";

export interface AgendaResourceData {
  id: number;
  judul: string;
  tanggal: string;
  mulai: string;
  selesai: string;
  lokasi: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toAgendaResource(row: AgendaRow): AgendaResourceData {
  return {
    id: row.id,
    judul: row.judul,
    tanggal: row.tanggal,
    mulai: row.mulai,
    selesai: row.selesai,
    lokasi: row.lokasi,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toAgendaCollection(rows: AgendaRow[]): AgendaResourceData[] {
  return rows.map(toAgendaResource);
}
