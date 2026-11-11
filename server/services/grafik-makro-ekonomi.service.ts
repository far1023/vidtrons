import "server-only"
import { unstable_cache } from "next/cache"
import { DISPLAY_CACHE_TAG, REGIONS_CACHE_TAG } from "@/lib/constants"
import {
  buildGrafikMakro,
  buildGrafikMakroMulti,
  type GrafikMakro,
  type GrafikMakroMulti,
} from "@/lib/makro-ekonomi"
import * as makroEkonomiModel from "@/server/models/makro-ekonomi.model"
import * as regionModel from "@/server/models/region.model"

/** Default region code: Kota Dumai (`14.72`). */
export const DEFAULT_REGION_KODE = "14.72"

async function fetchGrafik(): Promise<GrafikMakro | null> {
  const region = await regionModel.findByKode(DEFAULT_REGION_KODE)
  if (!region) return null
  const rows = await makroEkonomiModel.all({ regionIds: [region.id] })
  return buildGrafikMakro(rows)
}

/**
 * Uses the same DISPLAY_CACHE_TAG as the lobby display, so
 * tag revalidation after an admin changes data also refreshes this page.
 */
const getCachedGrafik = unstable_cache(fetchGrafik, ["grafik-makro-ekonomi"], {
  tags: [DISPLAY_CACHE_TAG],
})

export async function getGrafikMakroEkonomi(): Promise<GrafikMakro | null> {
  if (process.env.NODE_ENV === "development") return fetchGrafik()
  try {
    return await getCachedGrafik()
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("static generation store missing") ||
        error.message.includes("incrementalCache missing"))
    ) {
      return fetchGrafik()
    }
    throw error
  }
}

export type GetGrafikMakroMultiOptions = {
  regionIds?: number[]
  tahun?: number
}

async function fetchGrafikMulti(
  requestedRegionIds: number[] | undefined,
  jumlahTahun: number
): Promise<GrafikMakroMulti | null> {
  let orderedRegions: regionModel.RegionRow[]

  if (!requestedRegionIds || requestedRegionIds.length === 0) {
    const def = await regionModel.findByKode(DEFAULT_REGION_KODE)
    if (!def || !def.isActive) return null
    orderedRegions = [def]
  } else {
    const found = await regionModel.findByIds(requestedRegionIds)
    const byId = new Map(found.filter((r) => r.isActive).map((r) => [r.id, r]))
    orderedRegions = requestedRegionIds
      .map((id) => byId.get(id))
      .filter((r): r is regionModel.RegionRow => Boolean(r))
    if (orderedRegions.length === 0) return null
  }

  const activeRegionIds = orderedRegions.map((r) => r.id)
  const rows = await makroEkonomiModel.all({ regionIds: activeRegionIds })

  return buildGrafikMakroMulti(rows, orderedRegions, jumlahTahun)
}

const getCachedGrafikMulti = unstable_cache(
  async (regionIdsKey: string, jumlahTahun: number) => {
    const requestedIds = regionIdsKey
      ? regionIdsKey.split(",").map(Number)
      : undefined
    return fetchGrafikMulti(requestedIds, jumlahTahun)
  },
  ["grafik-makro-multi"],
  {
    tags: [DISPLAY_CACHE_TAG, REGIONS_CACHE_TAG],
  }
)

export async function getGrafikMakroMulti(
  options: GetGrafikMakroMultiOptions = {}
): Promise<GrafikMakroMulti | null> {
  const jumlahTahun = options.tahun ?? 5
  const regionIdsKey =
    options.regionIds && options.regionIds.length > 0
      ? options.regionIds.join(",")
      : ""

  if (process.env.NODE_ENV === "development") {
    return fetchGrafikMulti(options.regionIds, jumlahTahun)
  }

  try {
    return await getCachedGrafikMulti(regionIdsKey, jumlahTahun)
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("static generation store missing") ||
        error.message.includes("incrementalCache missing"))
    ) {
      return fetchGrafikMulti(options.regionIds, jumlahTahun)
    }
    throw error
  }
}
