import "server-only"
import { revalidatePath, revalidateTag } from "next/cache"
import { DISPLAY_CACHE_TAG, REGIONS_CACHE_TAG } from "@/lib/constants"

function safeRevalidate(tag: string): void {
  try {
    revalidateTag(tag, "max")
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("static generation store missing")
    ) {
      return
    }
    throw error
  }
}

function safeRevalidatePath(path: string): void {
  try {
    revalidatePath(path)
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("static generation store missing")
    ) {
      return
    }
    throw error
  }
}

/**
 * Revalidates the display feed cache tag.
 * Safely handles environments where the Next.js static generation store is not present (e.g., unit test runners).
 */
export function revalidateDisplayCache(): void {
  safeRevalidate(DISPLAY_CACHE_TAG)
}

/** Revalidates the regions list cache (public `/api/regions`). */
export function revalidateRegionsCache(): void {
  safeRevalidate(REGIONS_CACHE_TAG)
}

/**
 * Clears all caches related to macro-economic indicators and regions
 * (`display-feed`, `regions-list`, `/grafik-makro-ekonomi`, and `/display`).
 */
export function revalidateMakroCache(): void {
  safeRevalidate(DISPLAY_CACHE_TAG)
  safeRevalidate(REGIONS_CACHE_TAG)
  safeRevalidatePath("/grafik-makro-ekonomi")
  safeRevalidatePath("/display")
}
