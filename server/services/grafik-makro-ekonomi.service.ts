import "server-only"
import { unstable_cache } from "next/cache"
import { DISPLAY_CACHE_TAG } from "@/lib/constants"
import { buildGrafikMakro, type GrafikMakro } from "@/lib/makro-ekonomi"
import * as makroEkonomiModel from "@/server/models/makro-ekonomi.model"

async function fetchGrafik(): Promise<GrafikMakro | null> {
  // Fetch all rows across years (including previous years' history)
  const rows = await makroEkonomiModel.all()
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
  // Always fetch fresh data in development
  if (process.env.NODE_ENV === "development") return fetchGrafik()
  return getCachedGrafik()
}
