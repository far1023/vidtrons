import "server-only";
import { NotFoundError } from "@/server/errors/app-error";
import { revalidateDisplayCache } from "@/server/services/cache";
import * as pengumumanModel from "@/server/models/pengumuman.model";
import type {
  CreatePengumumanInput,
  UpdatePengumumanInput,
} from "@/lib/schemas/pengumuman.schema";

export async function getAllPengumuman(): Promise<
  pengumumanModel.PengumumanWithKategoriRow[]
> {
  return pengumumanModel.allWithKategori();
}

export async function getPengumumanById(
  id: number
): Promise<pengumumanModel.PengumumanWithKategoriRow> {
  const item = await pengumumanModel.find(id);
  if (!item) {
    throw new NotFoundError(`Pengumuman dengan ID ${id} tidak ditemukan`);
  }
  return item;
}

export async function createPengumuman(
  data: CreatePengumumanInput
): Promise<pengumumanModel.PengumumanWithKategoriRow> {
  const created = await pengumumanModel.create(data);
  revalidateDisplayCache();
  // Fetch with joined kategori details
  const full = await pengumumanModel.find(created.id);
  if (!full) {
    throw new NotFoundError(`Pengumuman dengan ID ${created.id} tidak ditemukan`);
  }
  return full;
}

export async function updatePengumuman(
  id: number,
  data: UpdatePengumumanInput
): Promise<pengumumanModel.PengumumanWithKategoriRow> {
  const existing = await pengumumanModel.find(id);
  if (!existing) {
    throw new NotFoundError(`Pengumuman dengan ID ${id} tidak ditemukan`);
  }

  const updated = await pengumumanModel.update(id, data);
  if (!updated) {
    throw new NotFoundError(`Pengumuman dengan ID ${id} tidak ditemukan`);
  }

  revalidateDisplayCache();
  const full = await pengumumanModel.find(id);
  if (!full) {
    throw new NotFoundError(`Pengumuman dengan ID ${id} tidak ditemukan`);
  }
  return full;
}

export async function deletePengumuman(id: number): Promise<boolean> {
  const existing = await pengumumanModel.find(id);
  if (!existing) {
    throw new NotFoundError(`Pengumuman dengan ID ${id} tidak ditemukan`);
  }

  const deleted = await pengumumanModel.remove(id);
  if (!deleted) {
    throw new NotFoundError(`Pengumuman dengan ID ${id} gagal dihapus`);
  }

  revalidateDisplayCache();
  return true;
}
