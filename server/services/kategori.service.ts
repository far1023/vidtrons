import "server-only";
import { NotFoundError } from "@/server/errors/app-error";
import { broadcastPanelUpdate } from "@/server/services/realtime.service";
import * as kategoriModel from "@/server/models/kategori.model";
import type {
  CreateKategoriInput,
  UpdateKategoriInput,
} from "@/lib/schemas/kategori.schema";

export async function getAllKategori(): Promise<kategoriModel.KategoriRow[]> {
  return kategoriModel.all();
}

export async function getKategoriById(id: number): Promise<kategoriModel.KategoriRow> {
  const item = await kategoriModel.find(id);
  if (!item) {
    throw new NotFoundError(`Kategori dengan ID ${id} tidak ditemukan`);
  }
  return item;
}

export async function createKategori(
  data: CreateKategoriInput
): Promise<kategoriModel.KategoriRow> {
  const created = await kategoriModel.create(data);
  await broadcastPanelUpdate("pengumuman");
  return created;
}

export async function updateKategori(
  id: number,
  data: UpdateKategoriInput
): Promise<kategoriModel.KategoriRow> {
  const existing = await kategoriModel.find(id);
  if (!existing) {
    throw new NotFoundError(`Kategori dengan ID ${id} tidak ditemukan`);
  }

  const updated = await kategoriModel.update(id, data);
  if (!updated) {
    throw new NotFoundError(`Kategori dengan ID ${id} tidak ditemukan`);
  }

  await broadcastPanelUpdate("pengumuman");
  return updated;
}

export async function deleteKategori(id: number): Promise<boolean> {
  const existing = await kategoriModel.find(id);
  if (!existing) {
    throw new NotFoundError(`Kategori dengan ID ${id} tidak ditemukan`);
  }

  const deleted = await kategoriModel.remove(id);
  if (!deleted) {
    throw new NotFoundError(`Kategori dengan ID ${id} gagal dihapus`);
  }

  await broadcastPanelUpdate("pengumuman");
  return true;
}
