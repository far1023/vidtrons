"use client";

import { useMemo } from "react";
import { config } from "@/lib/config";
import type { PrayerTimeItem } from "@/lib/data-sources";

export interface ActivePrayerInfo {
  key: string;
  nama: string;
  waktu: string;
  at: number; // seconds since midnight
}

export interface PrayerModeState {
  isAzanMode: boolean;
  activePrayer: ActivePrayerInfo | null;
  nextPrayer: ActivePrayerInfo | null;
  targetPrayer: ActivePrayerInfo | null;
  isArrived: boolean;
  countdown: string;
  nextIndex: number;
}

const DEFAULT_PRAYER_TIMINGS: PrayerTimeItem[] = [
  { key: "subuh", nama: "Subuh", waktu: "04:50" },
  { key: "dzuhur", nama: "Dzuhur", waktu: "12:08" },
  { key: "ashar", nama: "Ashar", waktu: "15:20" },
  { key: "maghrib", nama: "Maghrib", waktu: "18:12" },
  { key: "isya", nama: "Isya", waktu: "19:22" },
];

function timeToSeconds(hhmm: string): number {
  const parts = hhmm.split(":").map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  return h * 3600 + m * 60;
}

export function formatCountdown(diffSeconds: number): string {
  if (diffSeconds <= 0) return "00:00";
  const hours = Math.floor(diffSeconds / 3600);
  const mins = Math.floor((diffSeconds % 3600) / 60);
  const secs = diffSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function usePrayerMode(
  jadwal: PrayerTimeItem[] | undefined,
  secondsNow: number,
  beforeMinutes: number = config.azanSebelumMenit,
  afterMinutes: number = config.azanSesudahMenit
): PrayerModeState {
  return useMemo(() => {
    // If jadwal is missing or empty, use fallback timings so calculations never fail
    const items =
      jadwal && jadwal.length > 0 ? jadwal : DEFAULT_PRAYER_TIMINGS;

    const beforeSec = beforeMinutes * 60;
    const afterSec = afterMinutes * 60;

    const prayersWithSeconds = items.map((item) => ({
      ...item,
      at: timeToSeconds(item.waktu),
    }));

    // Find next upcoming prayer relative to current secondsNow
    let nextIdx = prayersWithSeconds.findIndex((j) => j.at > secondsNow);
    let diffToNext = 0;

    if (nextIdx === -1) {
      // Past Isha: next upcoming is tomorrow's Subuh (index 0)
      nextIdx = 0;
      const subuhTomorrow = prayersWithSeconds[0];
      diffToNext = 86400 - secondsNow + (subuhTomorrow?.at ?? 0);
    } else {
      diffToNext = prayersWithSeconds[nextIdx].at - secondsNow;
    }

    const nextPrayer = prayersWithSeconds[nextIdx] || null;

    // Check if any prayer falls into the azan window: [at - beforeSec, at + afterSec)
    const active =
      prayersWithSeconds.find(
        (j) => secondsNow >= j.at - beforeSec && secondsNow < j.at + afterSec
      ) || null;

    if (active) {
      const diffActive = active.at - secondsNow;
      const isArrived = diffActive <= 0;
      const countdown = isArrived ? "" : formatCountdown(diffActive);

      return {
        isAzanMode: true,
        activePrayer: active,
        nextPrayer,
        targetPrayer: active,
        isArrived,
        countdown,
        nextIndex: nextIdx,
      };
    }

    // Normal mode (outside azan window). targetPrayer and countdown always point
    // directly to the nearest upcoming prayer so preview/bug conditions remain fully valid.
    return {
      isAzanMode: false,
      activePrayer: null,
      nextPrayer,
      targetPrayer: nextPrayer,
      isArrived: false,
      countdown: diffToNext > 0 ? formatCountdown(diffToNext) : "",
      nextIndex: nextIdx,
    };
  }, [jadwal, secondsNow, beforeMinutes, afterMinutes]);
}
