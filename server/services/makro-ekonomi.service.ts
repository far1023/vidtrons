import "server-only";
import { NotFoundError } from "@/server/errors/app-error";
import { broadcastPanelUpdate } from "@/server/services/realtime.service";
import * as makroEkonomiModel from "@/server/models/makro-ekonomi.model";
import type {
  CreateMakroEkonomiInput,
  UpdateMakroEkonomiInput,
} from "@/lib/schemas/makro-ekonomi.schema";

export async function getAllMakroEkonomi(): Promise<makroEkonomiModel.MakroEkonomiRow[]> {
  return makroEkonomiModel.all();
}

export async function getActiveMakroEkonomi(): Promise<makroEkonomiModel.MakroEkonomiRow[]> {
  return makroEkonomiModel.active();
}

export async function getMakroEkonomiById(
  id: number
): Promise<makroEkonomiModel.MakroEkonomiRow> {
  const item = await makroEkonomiModel.find(id);
  if (!item) {
    throw new NotFoundError(`Indikator makro ekonomi dengan ID ${id} tidak ditemukan`);
  }
  return item;
}

export async function createMakroEkonomi(
  data: CreateMakroEkonomiInput
): Promise<makroEkonomiModel.MakroEkonomiRow> {
  const created = await makroEkonomiModel.create(data);
  await broadcastPanelUpdate("makroEkonomi");
  return created;
}

export async function updateMakroEkonomi(
  id: number,
  data: UpdateMakroEkonomiInput
): Promise<makroEkonomiModel.MakroEkonomiRow> {
  const existing = await makroEkonomiModel.find(id);
  if (!existing) {
    throw new NotFoundError(`Indikator makro ekonomi dengan ID ${id} tidak ditemukan`);
  }

  const updated = await makroEkonomiModel.update(id, data);
  if (!updated) {
    throw new NotFoundError(`Indikator makro ekonomi dengan ID ${id} tidak ditemukan`);
  }

  await broadcastPanelUpdate("makroEkonomi");
  return updated;
}

export async function deleteMakroEkonomi(id: number): Promise<boolean> {
  const existing = await makroEkonomiModel.find(id);
  if (!existing) {
    throw new NotFoundError(`Indikator makro ekonomi dengan ID ${id} tidak ditemukan`);
  }

  const deleted = await makroEkonomiModel.remove(id);
  if (!deleted) {
    throw new NotFoundError(`Indikator makro ekonomi dengan ID ${id} gagal dihapus`);
  }

  await broadcastPanelUpdate("makroEkonomi");
  return true;
}
