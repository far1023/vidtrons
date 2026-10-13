import "server-only";
import { NotFoundError } from "@/server/errors/app-error";
import { revalidateDisplayCache } from "@/server/services/cache";
import * as promoModel from "@/server/models/promo.model";
import type {
  CreatePromoInput,
  UpdatePromoInput,
} from "@/lib/schemas/promo.schema";

export async function getAllPromo(): Promise<promoModel.PromoRow[]> {
  return promoModel.all();
}

export async function getPromoById(id: number): Promise<promoModel.PromoRow> {
  const item = await promoModel.find(id);
  if (!item) {
    throw new NotFoundError(`Promo dengan ID ${id} tidak ditemukan`);
  }
  return item;
}

export async function createPromo(
  data: CreatePromoInput
): Promise<promoModel.PromoRow> {
  const created = await promoModel.create(data);
  revalidateDisplayCache();
  return created;
}

export async function updatePromo(
  id: number,
  data: UpdatePromoInput
): Promise<promoModel.PromoRow> {
  const existing = await promoModel.find(id);
  if (!existing) {
    throw new NotFoundError(`Promo dengan ID ${id} tidak ditemukan`);
  }

  const updated = await promoModel.update(id, data);
  if (!updated) {
    throw new NotFoundError(`Promo dengan ID ${id} tidak ditemukan`);
  }

  revalidateDisplayCache();
  return updated;
}

export async function deletePromo(id: number): Promise<boolean> {
  const existing = await promoModel.find(id);
  if (!existing) {
    throw new NotFoundError(`Promo dengan ID ${id} tidak ditemukan`);
  }

  const deleted = await promoModel.remove(id);
  if (!deleted) {
    throw new NotFoundError(`Promo dengan ID ${id} gagal dihapus`);
  }

  revalidateDisplayCache();
  return true;
}
