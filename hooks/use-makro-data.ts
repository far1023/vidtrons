"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import useSWR from "swr"
import {
  buildMakroEndpointUrl,
  type GrafikMakroMulti,
} from "@/lib/makro-ekonomi"

export { buildMakroEndpointUrl }

const STORAGE_KEY_PREFIX = "bppddmi_makro_multi_cache:"

/**
 * Clears all client-side localStorage caches related to macro-economic charts
 * and the lobby display feed.
 */
export function clearMakroLocalStorageCache(): void {
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (
        key &&
        (key.startsWith(STORAGE_KEY_PREFIX) ||
          key === "bppddmi_display_feed_v1")
      ) {
        keysToRemove.push(key)
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key)
    }
  } catch {
    // ignore storage errors on restricted browsers
  }
}

export type UseMakroDataOptions = {
  /** Selected region IDs (at most 5). Omit or empty for the default region. */
  regionIds?: readonly number[]
  /** Number of years in the chart window (defaults to 5). */
  tahun?: number
  /** Server-rendered initial data when showing the default selection. */
  fallbackData?: GrafikMakroMulti | null
}

async function fetcher(url: string): Promise<GrafikMakroMulti | null> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Gagal memuat data grafik makro: HTTP ${response.status}`)
  }
  const json = await response.json()
  return (json?.data ?? null) as GrafikMakroMulti | null
}

export function useMakroData(options: UseMakroDataOptions = {}) {
  const url = buildMakroEndpointUrl(options.regionIds, options.tahun)
  const storageKey = `${STORAGE_KEY_PREFIX}${url}`

  const memoryFallbackRef = useRef<GrafikMakroMulti | null>(
    options.fallbackData ?? null
  )
  const [cachedData, setCachedData] = useState<GrafikMakroMulti | null>(
    options.fallbackData ?? null
  )

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored) as GrafikMakroMulti
        memoryFallbackRef.current = parsed
        setCachedData(parsed)
      }
    } catch {
      // ignore storage errors on restricted browsers
    }
  }, [storageKey])

  const { data, error, isLoading, isValidating, mutate } =
    useSWR<GrafikMakroMulti | null>(url, fetcher, {
      fallbackData: options.fallbackData,
      revalidateOnFocus: false,
      dedupingInterval: 10_000,
      onSuccess: (freshData) => {
        if (freshData) {
          memoryFallbackRef.current = freshData
          try {
            localStorage.setItem(storageKey, JSON.stringify(freshData))
          } catch {
            // ignore quota errors
          }
        }
      },
    })

  const refresh = useCallback(async () => {
    clearMakroLocalStorageCache()
    const refreshUrl = `${url}${url.includes("?") ? "&" : "?"}refresh=1`
    const response = await fetch(refreshUrl, { cache: "no-store" })
    if (!response.ok) {
      throw new Error(
        `Gagal memuat ulang data grafik makro: HTTP ${response.status}`
      )
    }
    const json = await response.json()
    const freshData = (json?.data ?? null) as GrafikMakroMulti | null
    memoryFallbackRef.current = freshData
    setCachedData(freshData)
    if (freshData) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(freshData))
      } catch {
        // ignore quota errors
      }
    }
    await mutate(freshData, { revalidate: false })
    return freshData
  }, [url, storageKey, mutate])

  const effectiveData =
    data !== undefined
      ? data
      : (memoryFallbackRef.current ?? cachedData ?? null)

  return {
    data: effectiveData,
    isLoading: isLoading && !effectiveData,
    isValidating,
    error,
    refresh,
  }
}
