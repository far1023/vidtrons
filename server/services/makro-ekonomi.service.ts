import "server-only";
import { NotFoundError, ValidationError } from "@/server/errors/app-error";
import { revalidateMakroCache } from "@/server/services/cache";
import { broadcastPanelUpdate } from "@/server/services/realtime.service";
import * as makroEkonomiModel from "@/server/models/makro-ekonomi.model";
import * as regionModel from "@/server/models/region.model";
import type {
  CreateMakroEkonomiInput,
  UpdateMakroEkonomiInput,
} from "@/lib/schemas/makro-ekonomi.schema";

export async function getAllMakroEkonomi(
  filter: makroEkonomiModel.MakroFilter = {}
): Promise<makroEkonomiModel.MakroEkonomiRow[]> {
  return makroEkonomiModel.all(filter);
}

export async function getActiveMakroEkonomi(
  filter: makroEkonomiModel.MakroFilter = {}
): Promise<makroEkonomiModel.MakroEkonomiRow[]> {
  return makroEkonomiModel.active(filter);
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

async function assertRegionExists(regionId: number): Promise<void> {
  const region = await regionModel.find(regionId);
  if (!region) {
    throw new ValidationError("Validasi data indikator makro ekonomi gagal", {
      regionId: [`Wilayah dengan ID ${regionId} tidak ditemukan`],
    });
  }
}

/** Postgres unique_violation (23505), possibly wrapped by the driver. */
function isUniqueViolation(error: unknown): boolean {
  const code = (e: unknown) => (e as { code?: string } | null)?.code;
  return (
    code(error) === "23505" ||
    code((error as { cause?: unknown } | null)?.cause) === "23505"
  );
}

function duplicateError(): ValidationError {
  return new ValidationError("Validasi data indikator makro ekonomi gagal", {
    tahun: ["Data untuk wilayah, indikator, dan tahun ini sudah ada"],
  });
}

export async function createMakroEkonomi(
  data: CreateMakroEkonomiInput
): Promise<makroEkonomiModel.MakroEkonomiRow> {
  if (data.regionId !== undefined) await assertRegionExists(data.regionId);

  let created: makroEkonomiModel.MakroEkonomiRow;
  try {
    created = await makroEkonomiModel.create(data);
  } catch (error) {
    if (isUniqueViolation(error)) throw duplicateError();
    throw error;
  }
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
  if (data.regionId !== undefined) await assertRegionExists(data.regionId);

  let updated: makroEkonomiModel.MakroEkonomiRow | null;
  try {
    updated = await makroEkonomiModel.update(id, data);
  } catch (error) {
    if (isUniqueViolation(error)) throw duplicateError();
    throw error;
  }
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

/**
 * Clears all server caches related to macro-economic indicators and regions,
 * broadcasts a realtime update to connected lobby displays, and returns
 * the freshly queried macro-economic rows from the database.
 */
export async function refreshMakroEkonomi(): Promise<
  makroEkonomiModel.MakroEkonomiRow[]
> {
  revalidateMakroCache();
  await broadcastPanelUpdate("makroEkonomi");
  return makroEkonomiModel.all();
}
