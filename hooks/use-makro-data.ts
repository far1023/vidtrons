"use client"

import { useEffect, useRef, useState } from "react"
import useSWR from "swr"
import {
  buildMakroEndpointUrl,
  type GrafikMakroMulti,
} from "@/lib/makro-ekonomi"

export { buildMakroEndpointUrl }

const STORAGE_KEY_PREFIX = "bppddmi_makro_multi_cache:"

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

  const effectiveData =
    data !== undefined
      ? data
      : (memoryFallbackRef.current ?? cachedData ?? null)

  return {
    data: effectiveData,
    isLoading: isLoading && !effectiveData,
    isValidating,
    error,
    refresh: mutate,
  }
}

