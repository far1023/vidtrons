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

export interface UseDisplayDataOptions {
  pusherKey?: string;
  pusherCluster?: string;
}

export function useDisplayData(options?: UseDisplayDataOptions) {
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

  // Pusher Realtime Subscription (per-panel update)
  const initialKey =
    options?.pusherKey ||
    process.env.NEXT_PUBLIC_PUSHER_KEY ||
    process.env.PUSHER_KEY ||
    "";

  const initialCluster =
    options?.pusherCluster ||
    process.env.NEXT_PUBLIC_PUSHER_CLUSTER ||
    process.env.PUSHER_CLUSTER ||
    "ap1";

  const [activeKey, setActiveKey] = useState<string>(initialKey);
  const [activeCluster, setActiveCluster] = useState<string>(initialCluster);

  // If Pusher key is not yet present on client, fetch it dynamically from /api/display/config
  useEffect(() => {
    if (activeKey) return;

    fetch("/api/display/config")
      .then((res) => (res.ok ? res.json() : null))
      .then((cfg) => {
        if (cfg?.pusher?.key) {
          setActiveKey(cfg.pusher.key);
          if (cfg.pusher.cluster) {
            setActiveCluster(cfg.pusher.cluster);
          }
        } else {
          console.warn(
            "[Pusher Client] PUSHER_KEY belum terdeteksi. Pastikan PUSHER_KEY sudah diset di .env.local dan server telah direstart."
          );
        }
      })
      .catch((err) => {
        console.warn("[Pusher Client] Gagal memuat konfigurasi Pusher:", err);
      });
  }, [activeKey]);

  useEffect(() => {
    if (!activeKey) return;

    let isSubscribed = true;
    let pusher: import("pusher-js").default | null = null;

    import("pusher-js").then(({ default: PusherClient }) => {
      if (!isSubscribed) return;

      console.log(
        `[Pusher Client] Menghubungkan ke Pusher (cluster: ${activeCluster})...`
      );

      pusher = new PusherClient(activeKey, {
        cluster: activeCluster,
      });

      pusher.connection.bind("connected", () => {
        console.log("[Pusher Client] Sukses terhubung ke Pusher server.");
      });

      pusher.connection.bind("error", (err: unknown) => {
        console.error("[Pusher Client] Error koneksi Pusher:", err);
      });

      const channel = pusher.subscribe("display-lobby");

      channel.bind("pusher:subscription_succeeded", () => {
        console.log(
          "[Pusher Client] Berhasil subscribe ke channel 'display-lobby'."
        );
      });

      channel.bind(
        "panel-update",
        async (payload: { panel?: string; data?: unknown }) => {
          if (!payload?.panel) return;

          console.log(
            `[Pusher Client] Menerima event update untuk panel '${payload.panel}':`,
            payload
          );

          const panelKeyMap: Record<string, keyof DisplayFeedData> = {
            pengumuman: "pengumuman",
            agenda: "agenda",
            runningText: "runningText",
            "running-text": "runningText",
            promo: "promo",
            video: "video",
            makroEkonomi: "makroEkonomi",
            "makro-ekonomi": "makroEkonomi",
            setting: "setting",
          };

          const targetKey = panelKeyMap[payload.panel];
          if (!targetKey) return;

          let panelData = payload.data;

          // If payload did not embed fresh data, fetch only this panel from server
          if (panelData === undefined) {
            try {
              const res = await fetch(`/api/display?panel=${targetKey}`);
              if (res.ok) {
                const json = await res.json();
                panelData =
                  json?.data?.data !== undefined ? json.data.data : json?.data;
              }
            } catch (fetchErr) {
              console.warn(
                `[Pusher Client] Gagal mengambil update data panel '${targetKey}':`,
                fetchErr
              );
              return;
            }
          }

          if (panelData !== undefined) {
            // Mutate ONLY the specific panel inside SWR without triggering a full revalidation
            mutate((prev) => {
              if (!prev) return prev;
              const updated: DisplayFeedData = {
                ...prev,
                [targetKey]: panelData,
              };
              memoryFallbackRef.current = updated;
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
              } catch {
                // ignore storage error
              }
              return updated;
            }, false);

            console.log(
              `[Pusher Client] Panel '${targetKey}' berhasil diperbarui di layar lobby!`
            );
          }
        }
      );
    });

    return () => {
      isSubscribed = false;
      if (pusher) {
        pusher.unsubscribe("display-lobby");
        pusher.disconnect();
      }
    };
  }, [activeKey, activeCluster, mutate]);

  // Fallback hierarchy: fresh SWR data -> in-memory ref -> localStorage state
  const effectiveData = data ?? memoryFallbackRef.current ?? cachedData;

  return {
    data: effectiveData,
    isLoading: isLoading && !effectiveData,
    error,
    refresh: mutate,
  };
}
