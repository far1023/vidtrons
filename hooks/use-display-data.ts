"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import type { DisplayFeedData } from "@/types/display";

const STORAGE_KEY = "bppddmi_display_feed_cache";
const POLL_INTERVAL_MS = 60_000;

async function fetcher(url: string): Promise<DisplayFeedData> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Gagal memuat display feed: HTTP ${response.status}`);
  }
  const json = await response.json();
  return json.data;
}

export function useDisplayData() {
  const memoryFallbackRef = useRef<DisplayFeedData | null>(null);
  const [cachedData, setCachedData] = useState<DisplayFeedData | null>(null);

  // Initialize from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DisplayFeedData;
        memoryFallbackRef.current = parsed;
        setCachedData(parsed);
      }
    } catch (err) {
      console.warn("Gagal membaca cache display dari localStorage:", err);
    }
  }, []);

  const { data, error, isLoading, mutate } = useSWR<DisplayFeedData>(
    "/api/display",
    fetcher,
    {
      refreshInterval: POLL_INTERVAL_MS,
      revalidateOnFocus: false,
      dedupingInterval: 10_000,
      onSuccess: (freshData) => {
        memoryFallbackRef.current = freshData;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(freshData));
        } catch (err) {
          console.warn("Gagal menyimpan cache display ke localStorage:", err);
        }
      },
    }
  );

  // Fallback hierarchy: fresh SWR data -> in-memory ref -> localStorage state
  const effectiveData = data ?? memoryFallbackRef.current ?? cachedData;

  return {
    data: effectiveData,
    isLoading: isLoading && !effectiveData,
    error,
    refresh: mutate,
  };
}
