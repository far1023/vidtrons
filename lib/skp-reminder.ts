import { config, getTodayDateString } from "@/lib/config"
import { labels } from "@/lib/labels"
import type { PengumumanItem } from "@/components/display/pengumuman-panel"

/** Days at the end of a month when the current month's SKP reminder shows. */
export const SKP_END_OF_MONTH_DAYS = 5
/** Days at the start of a month when the previous month's SKP reminder shows. */
export const SKP_START_OF_MONTH_DAYS = 5

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
]

/**
 * Static SKP reminder, not stored in the database. Dates use the configured
 * timezone, never the device timezone. Returns null outside the reminder windows.
 */
export function buildSkpReminder(
  today: string = getTodayDateString(config.timezone)
): PengumumanItem | null {
  const [year, month, day] = today.split("-").map(Number)
  if (!year || !month || !day) return null

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()

  let judul: string

  if (day > daysInMonth - SKP_END_OF_MONTH_DAYS) {
    judul = labels.skp.akhirBulan
  } else if (day <= SKP_START_OF_MONTH_DAYS) {
    const periodMonth = month === 1 ? 12 : month - 1
    const periodYear = month === 1 ? year - 1 : year
    judul = labels.skp.awalBulan(`${MONTH_NAMES[periodMonth - 1]} ${periodYear}`)
  } else {
    return null
  }

  return {
    id: -1,
    judul,
    tanggal: today,
    kategori: { nama: labels.skp.kategori, warna: "#b45309" },
  }
}

