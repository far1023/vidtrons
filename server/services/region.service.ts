import "server-only";
import { unstable_cache } from "next/cache";
import { REGIONS_CACHE_TAG } from "@/lib/constants";
import { NotFoundError, ValidationError } from "@/server/errors/app-error";
import * as regionModel from "@/server/models/region.model";
import type { RegionFilter } from "@/server/models/region.model";
import type {
  CreateRegionInput,
  UpdateRegionInput,
} from "@/lib/schemas/region.schema";
import {
  revalidateDisplayCache,
  revalidateRegionsCache,
} from "@/server/services/cache";

/** Admin view: every region, including inactive ones. */
export async function getAllRegions(
  filter: RegionFilter = {}
): Promise<regionModel.RegionRow[]> {
  return regionModel.all(filter);
}

const getCachedActiveRegions = unstable_cache(
  async (level: string, parentId: string, q: string) =>
    regionModel.all({
      activeOnly: true,
      level: (level || undefined) as regionModel.RegionLevel | undefined,
      parentId: parentId ? Number(parentId) : undefined,
      q: q || undefined,
    }),
  ["regions-active"],
  { tags: [REGIONS_CACHE_TAG] }
);

/**
 * Public view: active regions only. The table is near-static, so results are
 * served from the tagged cache (key includes the filter arguments).
 */
export async function getActiveRegions(
  filter: Omit<RegionFilter, "activeOnly"> = {}
): Promise<regionModel.RegionRow[]> {
  if (process.env.NODE_ENV === "development") {
    return regionModel.all({ ...filter, activeOnly: true });
  }
  try {
    return await getCachedActiveRegions(
      filter.level ?? "",
      filter.parentId === undefined ? "" : String(filter.parentId),
      filter.q ?? ""
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("static generation store missing") ||
        error.message.includes("incrementalCache missing"))
    ) {
      return regionModel.all({ ...filter, activeOnly: true });
    }
    throw error;
  }
}

export async function getRegionById(
  id: number
): Promise<regionModel.RegionRow> {
  const region = await regionModel.find(id);
  if (!region) {
    throw new NotFoundError(`Wilayah dengan ID ${id} tidak ditemukan`);
  }
  return region;
}

function getPgCode(error: unknown): string | undefined {
  const code = (e: unknown) => (e as { code?: string } | null)?.code;
  return code(error) ?? code((error as { cause?: unknown } | null)?.cause);
}

async function assertParentExists(
  parentId: number | null | undefined,
  selfId?: number
): Promise<void> {
  if (parentId === null || parentId === undefined) return;
  if (selfId !== undefined && parentId === selfId) {
    throw new ValidationError("Validasi data wilayah gagal", {
      parentId: ["Wilayah tidak dapat menjadi induk bagi dirinya sendiri"],
    });
  }
  const parent = await regionModel.find(parentId);
  if (!parent) {
    throw new ValidationError("Validasi data wilayah gagal", {
      parentId: [`Wilayah induk dengan ID ${parentId} tidak ditemukan`],
    });
  }
}

export async function createRegion(
  data: CreateRegionInput
): Promise<regionModel.RegionRow> {
  await assertParentExists(data.parentId);

  let created: regionModel.RegionRow;
  try {
    created = await regionModel.create(data);
  } catch (error) {
    if (getPgCode(error) === "23505") {
      throw new ValidationError("Validasi data wilayah gagal", {
        kode: [`Kode wilayah ${data.kode} sudah digunakan`],
      });
    }
    throw error;
  }

  revalidateRegionsCache();
  revalidateDisplayCache();
  return created;
}

export async function updateRegion(
  id: number,
  data: UpdateRegionInput
): Promise<regionModel.RegionRow> {
  await getRegionById(id);
  if (data.parentId !== undefined) {
    await assertParentExists(data.parentId, id);
  }

  let updated: regionModel.RegionRow | null;
  try {
    updated = await regionModel.update(id, data);
  } catch (error) {
    if (getPgCode(error) === "23505") {
      throw new ValidationError("Validasi pembaruan wilayah gagal", {
        kode: [`Kode wilayah ${data.kode} sudah digunakan`],
      });
    }
    throw error;
  }

  if (!updated) {
    throw new NotFoundError(`Wilayah dengan ID ${id} tidak ditemukan`);
  }

  revalidateRegionsCache();
  revalidateDisplayCache();
  return updated;
}

export async function deleteRegion(id: number): Promise<boolean> {
  await getRegionById(id);

  let deleted: boolean;
  try {
    deleted = await regionModel.remove(id);
  } catch (error) {
    if (getPgCode(error) === "23503") {
      throw new ValidationError(
        "Wilayah tidak dapat dihapus karena masih memiliki data makro ekonomi atau sub-wilayah yang terhubung",
        {
          id: [
            "Hapus atau pindahkan data indikator makro ekonomi dan sub-wilayah terlebih dahulu",
          ],
        }
      );
    }
    throw error;
  }

  if (!deleted) {
    throw new NotFoundError(`Wilayah dengan ID ${id} gagal dihapus`);
  }

  revalidateRegionsCache();
  revalidateDisplayCache();
  return true;
}
