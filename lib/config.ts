export interface DashboardConfig {
  timezone: string;
  timezoneLabel: string;
  carouselDetik: number;
  azanSebelumMenit: number;
  azanSesudahMenit: number;
  promoDetik: number;
  promoPerTampilan: number;
  promoDefault: string;
  scrollKecepatan: number;
  scrollJedaDetik: number;
}

export const config: DashboardConfig = {
  timezone: process.env.NEXT_PUBLIC_DASHBOARD_TIMEZONE || process.env.DASHBOARD_TIMEZONE || "Asia/Jakarta",
  timezoneLabel: process.env.NEXT_PUBLIC_DASHBOARD_TIMEZONE_LABEL || process.env.DASHBOARD_TIMEZONE_LABEL || "WIB",
  carouselDetik: Number(process.env.NEXT_PUBLIC_DASHBOARD_CAROUSEL_DETIK || process.env.DASHBOARD_CAROUSEL_DETIK) || 10,
  azanSebelumMenit: Number(process.env.NEXT_PUBLIC_DASHBOARD_AZAN_SEBELUM_MENIT || process.env.DASHBOARD_AZAN_SEBELUM_MENIT) || 10,
  azanSesudahMenit: Number(process.env.NEXT_PUBLIC_DASHBOARD_AZAN_SESUDAH_MENIT || process.env.DASHBOARD_AZAN_SESUDAH_MENIT) || 5,
  promoDetik: Number(process.env.NEXT_PUBLIC_DASHBOARD_PROMO_DETIK || process.env.DASHBOARD_PROMO_DETIK) || 8,
  promoPerTampilan: Number(process.env.NEXT_PUBLIC_DASHBOARD_PROMO_PER_TAMPILAN || process.env.DASHBOARD_PROMO_PER_TAMPILAN) || 1,
  promoDefault: process.env.NEXT_PUBLIC_DASHBOARD_PROMO_DEFAULT || process.env.DASHBOARD_PROMO_DEFAULT || "",
  scrollKecepatan: Number(process.env.NEXT_PUBLIC_DASHBOARD_SCROLL_KECEPATAN || process.env.DASHBOARD_SCROLL_KECEPATAN) || 0.06,
  scrollJedaDetik: Number(process.env.NEXT_PUBLIC_DASHBOARD_SCROLL_JEDA_DETIK || process.env.DASHBOARD_SCROLL_JEDA_DETIK) || 3,
};

/**
 * Returns today's date formatted as YYYY-MM-DD in the configured timezone.
 */
export function getTodayDateString(timezone: string = config.timezone): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

/**
 * Returns a date string formatted as YYYY-MM-DD in the configured timezone,
 * offset by a given number of days from today.
 */
export function getDateOffsetString(offsetDays: number, timezone: string = config.timezone): string {
  const target = new Date();
  target.setDate(target.getDate() + offsetDays);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(target);
}

/**
 * Returns the current seconds since midnight in the configured timezone.
 */
export function getSecondsSinceMidnight(date: Date = new Date(), timezone: string = config.timezone): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  for (const part of parts) {
    if (part.type === "hour") hours = Number(part.value);
    if (part.type === "minute") minutes = Number(part.value);
    if (part.type === "second") seconds = Number(part.value);
  }

  return hours * 3600 + minutes * 60 + seconds;
}
