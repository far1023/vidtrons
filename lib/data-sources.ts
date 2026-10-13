import { LOCATION } from "@/lib/location";
import { labels } from "@/lib/labels";

export const ALADHAN_METHOD = 11;

/**
 * Per-prayer adjustments in minutes if the official schedule differs slightly.
 */
export const PRAYER_MINUTE_ADJUSTMENTS: Record<string, number> = {
  Fajr: 0,
  Dhuhr: 0,
  Asr: 0,
  Maghrib: 0,
  Isha: 0,
};

export interface PrayerTimeItem {
  key: "subuh" | "dzuhur" | "ashar" | "maghrib" | "isya";
  nama: string;
  waktu: string; // HH:mm format
}

/**
 * Constructs the AlAdhan prayer timings API URL.
 * Date format is DD-MM-YYYY in DASHBOARD_TIMEZONE.
 */
export function buildAlAdhanUrl(dateDDMMYYYY: string, method = ALADHAN_METHOD): string {
  return `https://api.aladhan.com/v1/timings/${dateDDMMYYYY}?latitude=${LOCATION.latitude}&longitude=${LOCATION.longitude}&method=${method}`;
}

/**
 * Constructs the Open-Meteo forecast API URL.
 */
export function buildOpenMeteoUrl(): string {
  return `https://api.open-meteo.com/v1/forecast?latitude=${LOCATION.latitude}&longitude=${LOCATION.longitude}&current_weather=true`;
}

/**
 * Adjusts a "HH:mm" time by adding or subtracting minutes.
 */
function adjustTime(timeStr: string, adjustMinutes = 0): string {
  const parts = timeStr.slice(0, 5).split(":");
  if (parts.length < 2) return timeStr;

  let totalMinutes = Number(parts[0]) * 60 + Number(parts[1]) + adjustMinutes;
  // Wrap in 24h
  totalMinutes = ((totalMinutes % 1440) + 1440) % 1440;

  const h = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const m = String(totalMinutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Parses raw AlAdhan timings into the mapped prayer schedule list.
 */
export function parsePrayerTimings(
  rawTimings: Record<string, string>
): PrayerTimeItem[] {
  const mapping: Array<{
    key: "subuh" | "dzuhur" | "ashar" | "maghrib" | "isya";
    rawKey: string;
    label: string;
  }> = [
    { key: "subuh", rawKey: "Fajr", label: labels.sholat.subuh },
    { key: "dzuhur", rawKey: "Dhuhr", label: labels.sholat.dzuhur },
    { key: "ashar", rawKey: "Asr", label: labels.sholat.ashar },
    { key: "maghrib", rawKey: "Maghrib", label: labels.sholat.maghrib },
    { key: "isya", rawKey: "Isha", label: labels.sholat.isya },
  ];

  return mapping.map(({ key, rawKey, label }) => {
    const rawVal = rawTimings[rawKey] || "--:--";
    const adjusted = adjustTime(rawVal, PRAYER_MINUTE_ADJUSTMENTS[rawKey] ?? 0);
    return {
      key,
      nama: label,
      waktu: adjusted,
    };
  });
}
