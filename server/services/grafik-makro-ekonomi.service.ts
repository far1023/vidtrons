import "server-only"
import { unstable_cache } from "next/cache"
import { DISPLAY_CACHE_TAG } from "@/lib/constants"
import { buildGrafikMakro, type GrafikMakro } from "@/lib/makro-ekonomi"
import * as makroEkonomiModel from "@/server/models/makro-ekonomi.model"

async function fetchGrafik(): Promise<GrafikMakro | null> {
  // Butuh SEMUA baris aktif lintas tahun (bukan hanya tahun terbaru)
  const rows = await makroEkonomiModel.active()
  return buildGrafikMakro(rows)
}

/**
 * Memakai DISPLAY_CACHE_TAG yang sama dengan layar lobi, sehingga
 * revalidasi tag setelah admin mengubah data otomatis menyegarkan halaman ini.
 */
const getCachedGrafik = unstable_cache(fetchGrafik, ["grafik-makro-ekonomi"], {
  tags: [DISPLAY_CACHE_TAG],
})

export async function getGrafikMakroEkonomi(): Promise<GrafikMakro | null> {
  // Saat development selalu ambil data segar
  if (process.env.NODE_ENV === "development") return fetchGrafik()
  return getCachedGrafik()
}
