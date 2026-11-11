/**
 * Helper murni (tanpa akses DB) untuk halaman grafik makro ekonomi.
 *
 * Model data: tabel `makro_ekonomi` menyimpan satu baris per (region_id, judul, tahun).
 * Baris dikelompokkan berdasarkan `judul` (dan `regionId` pada mode multi-wilayah);
 * `nilai` dan `tahun` bertipe teks sehingga diurai di sini.
 */

export type MakroRow = {
  id: number
  regionId?: number
  judul: string
  nilai: string
  satuan: string
  tahun: string
  tren: string
  urutan: number
  isActive?: boolean
}

export type RegionInfo = {
  id: number
  kode: string
  nama: string
  level: "nasional" | "provinsi" | "kabkota" | string
  warna: string | null
}

export type ResolvedRegionInfo = Omit<RegionInfo, "warna"> & {
  warna: string
}

export type Arah = "naik" | "turun" | "tetap"
export type Sentimen = "positif" | "negatif" | "netral"

export type TitikData = {
  tahun: number
  /** Angka hasil urai; null jika tahun tersebut belum ada datanya (jadi celah di grafik). */
  nilai: number | null
  /** Teks nilai persis seperti yang diinput admin (mis. "5,21"). */
  nilaiLabel: string | null
}

export type Delta = {
  arah: Arah
  sentimen: Sentimen
  selisihLabel: string
  tahunPembanding: number
}

export type Indikator = {
  judul: string
  satuan: string
  jenisGrafik: "garis" | "batang"
  /** Tahun data terakhir milik indikator ini (bisa lebih lama dari tahun terbaru global). */
  tahunTerbaru: number
  nilaiTerbaru: string
  delta: Delta | null
  /** Selalu berisi satu titik untuk setiap tahun di jendela (tahunAwal..tahunAkhir). */
  titik: TitikData[]
  urutan: number
}

export type GrafikMakro = {
  tahunAwal: number
  tahunAkhir: number
  indikator: Indikator[]
}

export type SeriWilayah = {
  regionId: number
  tahunTerbaru: number
  nilaiTerbaru: string
  delta: Delta | null
  titik: TitikData[]
}

export type IndikatorMulti = {
  judul: string
  satuan: string
  jenisGrafik: "garis" | "batang"
  urutan: number
  seri: SeriWilayah[]
}

export type GrafikMakroMulti = {
  tahunAwal: number
  tahunAkhir: number
  regions: ResolvedRegionInfo[]
  indikator: IndikatorMulti[]
}

/**
 * Palet warna cadangan (selaras dengan `--chart-region-1..8` di `app/globals.css`).
 * Dipilih berdasarkan indeks urutan wilayah bila `regions.warna` bernilai null.
 */
export const REGION_FALLBACK_PALETTE = [
  "#059669", // emerald-600
  "#1d4ed8", // blue-700
  "#b91c1c", // red-700
  "#d97706", // amber-600
  "#7c3aed", // violet-600
  "#0e7490", // cyan-700
  "#be185d", // pink-700
  "#4338ca", // indigo-700
] as const

export function resolveRegionColors(
  regions: readonly RegionInfo[]
): ResolvedRegionInfo[] {
  const usedColors = new Set<string>(
    regions
      .map((r) => r.warna?.toLowerCase())
      .filter((w): w is string => Boolean(w))
  )
  let paletteIdx = 0

  return regions.map((r, index) => {
    if (r.warna) {
      return { ...r, warna: r.warna }
    }
    while (
      paletteIdx < REGION_FALLBACK_PALETTE.length &&
      usedColors.has(REGION_FALLBACK_PALETTE[paletteIdx].toLowerCase())
    ) {
      paletteIdx++
    }
    const chosen =
      paletteIdx < REGION_FALLBACK_PALETTE.length
        ? REGION_FALLBACK_PALETTE[paletteIdx++]
        : REGION_FALLBACK_PALETTE[index % REGION_FALLBACK_PALETTE.length]
    usedColors.add(chosen.toLowerCase())
    return { ...r, warna: chosen }
  })
}

/* -------------------------------------------------------------------------- */
/*  Parsing & format                                                          */
/* -------------------------------------------------------------------------- */

const formatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 })
export const formatAngka = (n: number) => formatter.format(n)

/**
 * Urai angka berformat Indonesia: "5,21" -> 5.21, "1.234,5" -> 1234.5,
 * "128,5" -> 128.5. Titik tunggal dengan pola ribuan ("1.234") dianggap
 * pemisah ribuan; selain itu dianggap desimal.
 */
export function parseNilai(raw: string): number | null {
  let s = raw
    .trim()
    .replace(/[−–]/g, "-")
    .replace(/\s+/g, "")
    .replace(/[^\d.,-]/g, "")
  if (!/\d/.test(s)) return null

  const hasDot = s.includes(".")
  const hasComma = s.includes(",")

  if (hasDot && hasComma) {
    // Pemisah desimal adalah yang muncul paling akhir
    s =
      s.lastIndexOf(",") > s.lastIndexOf(".")
        ? s.replace(/\./g, "").replace(",", ".")
        : s.replace(/,/g, "")
  } else if (hasComma) {
    s =
      (s.match(/,/g) ?? []).length > 1
        ? s.replace(/,/g, "")
        : s.replace(",", ".")
  } else if (hasDot && /^-?\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, "")
  }

  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** Ambil tahun 4 digit pertama dari teks (mis. "2024", "Tahun 2023"). */
export function parseTahun(raw: string): number | null {
  const m = raw.match(/(?:19|20)\d{2}/)
  return m ? Number(m[0]) : null
}

/** Arah + penilaian dari kolom `tren` (termasuk nilai lama "naik"/"turun"). */
export function parseTren(tren: string): { arah: Arah; sentimen: Sentimen } {
  switch (tren) {
    case "naik_positif":
    case "naik":
      return { arah: "naik", sentimen: "positif" }
    case "naik_negatif":
      return { arah: "naik", sentimen: "negatif" }
    case "turun_positif":
      return { arah: "turun", sentimen: "positif" }
    case "turun_negatif":
    case "turun":
      return { arah: "turun", sentimen: "negatif" }
    default:
      return { arah: "tetap", sentimen: "netral" }
  }
}

const normalizeJudul = (s: string) => s.trim().replace(/\s+/g, " ")

/* -------------------------------------------------------------------------- */
/*  Pembangun data grafik                                                     */
/* -------------------------------------------------------------------------- */

type Parsed = { row: MakroRow; tahun: number; nilai: number }

function computeDelta(
  terbaru: TitikData,
  pembanding: TitikData | undefined,
  latestRow: MakroRow,
  satuan: string
): Delta | null {
  if (!pembanding || terbaru.nilai === null || pembanding.nilai === null) {
    return null
  }
  const selisih = terbaru.nilai - pembanding.nilai
  const arah: Arah =
    Math.abs(selisih) < 1e-9 ? "tetap" : selisih > 0 ? "naik" : "turun"
  const tren = parseTren(latestRow.tren)
  // Warna hanya dipercaya jika arah di kolom `tren` sama dengan arah hitungan
  const sentimen: Sentimen = tren.arah === arah ? tren.sentimen : "netral"
  const unit = satuan === "%" ? "poin persentase" : satuan
  return {
    arah,
    sentimen,
    selisihLabel: `${formatAngka(Math.abs(selisih))} ${unit}`.trim(),
    tahunPembanding: pembanding.tahun,
  }
}

/**
 * Susun data grafik satu seri: jendela `jumlahTahun` tahun yang berakhir di tahun
 * terbaru yang ada di data (bukan tahun berjalan), dikelompokkan per judul.
 * Jika ada lebih dari satu baris untuk (judul, tahun) yang sama, dipakai
 * baris dengan id terbesar (input terbaru).
 */
export function buildGrafikMakro(
  rows: readonly MakroRow[],
  jumlahTahun = 5
): GrafikMakro | null {
  const parsed: Parsed[] = []
  for (const row of rows) {
    const tahun = parseTahun(row.tahun)
    const nilai = parseNilai(row.nilai)
    if (tahun === null || nilai === null) continue
    parsed.push({ row, tahun, nilai })
  }
  if (parsed.length === 0) return null

  const tahunAkhir = Math.max(...parsed.map((p) => p.tahun))
  const tahunAwal = tahunAkhir - (jumlahTahun - 1)
  const daftarTahun = Array.from(
    { length: jumlahTahun },
    (_, i) => tahunAwal + i
  )

  // Kelompokkan per judul (abaikan huruf besar/kecil dan spasi ganda)
  const groups = new Map<
    string,
    { judul: string; byYear: Map<number, Parsed> }
  >()
  for (const p of parsed) {
    if (p.tahun < tahunAwal) continue
    const judul = normalizeJudul(p.row.judul)
    const key = judul.toLowerCase()
    let group = groups.get(key)
    if (!group) {
      group = { judul, byYear: new Map() }
      groups.set(key, group)
    }
    const existing = group.byYear.get(p.tahun)
    if (!existing || p.row.id > existing.row.id) group.byYear.set(p.tahun, p)
  }

  const indikator: Indikator[] = []
  for (const { judul, byYear } of groups.values()) {
    const titik: TitikData[] = daftarTahun.map((tahun) => {
      const p = byYear.get(tahun)
      return {
        tahun,
        nilai: p ? p.nilai : null,
        nilaiLabel: p ? p.row.nilai.trim() : null,
      }
    })

    const terisi = titik.filter((t) => t.nilai !== null)
    if (terisi.length === 0) continue
    const terbaru = terisi[terisi.length - 1]
    const pembanding = terisi[terisi.length - 2]
    const latestRow = byYear.get(terbaru.tahun)!.row

    // Jika data tahun terbaru dinonaktifkan oleh admin, lewati indikator ini
    if (latestRow.isActive === false) continue

    const satuan = latestRow.satuan.trim()
    const delta = computeDelta(terbaru, pembanding, latestRow, satuan)

    const satuanKecil = satuan.toLowerCase()
    indikator.push({
      judul,
      satuan,
      jenisGrafik:
        satuanKecil === "%" || satuanKecil === "poin" ? "garis" : "batang",
      tahunTerbaru: terbaru.tahun,
      nilaiTerbaru: terbaru.nilaiLabel ?? "",
      delta,
      titik,
      urutan: latestRow.urutan,
    })
  }

  indikator.sort(
    (a, b) => a.urutan - b.urutan || a.judul.localeCompare(b.judul, "id")
  )

  return { tahunAwal, tahunAkhir, indikator }
}

/**
 * Susun data grafik multi-wilayah: mengelompokkan per `judul` lalu per `regionId`
 * sesuai urutan `regions` yang diminta. Indikator ditampilkan jika minimal satu
 * wilayah memiliki data aktif di jendela tahun.
 */
export function buildGrafikMakroMulti(
  rows: readonly MakroRow[],
  regions: readonly RegionInfo[],
  jumlahTahun = 5
): GrafikMakroMulti | null {
  if (regions.length === 0) return null
  const resolvedRegions = resolveRegionColors(regions)
  const regionIdSet = new Set(resolvedRegions.map((r) => r.id))

  const parsed: (Parsed & { regionId: number })[] = []
  for (const row of rows) {
    if (row.regionId === undefined || !regionIdSet.has(row.regionId)) continue
    const tahun = parseTahun(row.tahun)
    const nilai = parseNilai(row.nilai)
    if (tahun === null || nilai === null) continue
    parsed.push({ row, regionId: row.regionId, tahun, nilai })
  }
  if (parsed.length === 0) return null

  const tahunAkhir = Math.max(...parsed.map((p) => p.tahun))
  const tahunAwal = tahunAkhir - (jumlahTahun - 1)
  const daftarTahun = Array.from(
    { length: jumlahTahun },
    (_, i) => tahunAwal + i
  )

  // Kelompokkan per judul -> regionId -> tahun
  const groups = new Map<
    string,
    {
      judul: string
      byRegion: Map<number, Map<number, Parsed>>
    }
  >()

  for (const p of parsed) {
    if (p.tahun < tahunAwal) continue
    const judul = normalizeJudul(p.row.judul)
    const key = judul.toLowerCase()
    let group = groups.get(key)
    if (!group) {
      group = { judul, byRegion: new Map() }
      groups.set(key, group)
    }
    let byYear = group.byRegion.get(p.regionId)
    if (!byYear) {
      byYear = new Map()
      group.byRegion.set(p.regionId, byYear)
    }
    const existing = byYear.get(p.tahun)
    if (!existing || p.row.id > existing.row.id) {
      byYear.set(p.tahun, p)
    }
  }

  const indikator: IndikatorMulti[] = []
  for (const { judul, byRegion } of groups.values()) {
    const seri: SeriWilayah[] = []
    let primarySatuan: string | null = null
    let primaryUrutan: number | null = null

    // Iterasi sesuai urutan regions yang diminta agar urutan seri konsisten
    for (const region of resolvedRegions) {
      const byYear = byRegion.get(region.id)
      if (!byYear) continue

      const titik: TitikData[] = daftarTahun.map((tahun) => {
        const p = byYear.get(tahun)
        return {
          tahun,
          nilai: p ? p.nilai : null,
          nilaiLabel: p ? p.row.nilai.trim() : null,
        }
      })

      const terisi = titik.filter((t) => t.nilai !== null)
      if (terisi.length === 0) continue
      const terbaru = terisi[terisi.length - 1]
      const pembanding = terisi[terisi.length - 2]
      const latestRow = byYear.get(terbaru.tahun)!.row

      // Jika data tahun terbaru untuk wilayah ini dinonaktifkan, lewati seri wilayah ini
      if (latestRow.isActive === false) continue

      const satuan = latestRow.satuan.trim()
      if (primarySatuan === null) primarySatuan = satuan
      if (primaryUrutan === null) primaryUrutan = latestRow.urutan

      const delta = computeDelta(terbaru, pembanding, latestRow, satuan)

      seri.push({
        regionId: region.id,
        tahunTerbaru: terbaru.tahun,
        nilaiTerbaru: terbaru.nilaiLabel ?? "",
        delta,
        titik,
      })
    }

    if (seri.length === 0) continue

    const satuan = primarySatuan ?? "%"
    const satuanKecil = satuan.toLowerCase()
    indikator.push({
      judul,
      satuan,
      jenisGrafik:
        satuanKecil === "%" || satuanKecil === "poin" ? "garis" : "batang",
      urutan: primaryUrutan ?? 0,
      seri,
    })
  }

  if (indikator.length === 0) return null

  indikator.sort(
    (a, b) => a.urutan - b.urutan || a.judul.localeCompare(b.judul, "id")
  )

  return {
    tahunAwal,
    tahunAkhir,
    regions: resolvedRegions,
    indikator,
  }
}

export type PivotChartRow = {
  tahun: number
  [key: string]: number | string | null
}

/**
 * Mengubah daftar `SeriWilayah` menjadi baris tahunan untuk Recharts:
 * `{ tahun: 2024, r14: 5.21, r14_label: "5,21", r1: 5.02, r1_label: "5,02" }`
 */
export function pivotSeriByTahun(
  seri: readonly SeriWilayah[],
  tahunAwal: number,
  tahunAkhir: number
): PivotChartRow[] {
  const result: PivotChartRow[] = []
  for (let tahun = tahunAwal; tahun <= tahunAkhir; tahun++) {
    const row: PivotChartRow = { tahun }
    for (const s of seri) {
      const titik = s.titik.find((t) => t.tahun === tahun)
      row[`r${s.regionId}`] = titik ? titik.nilai : null
      row[`r${s.regionId}_label`] = titik ? titik.nilaiLabel : null
    }
    result.push(row)
  }
  return result
}

export function buildMakroEndpointUrl(
  regionIds?: readonly number[],
  tahun?: number
): string {
  const params = new URLSearchParams()
  if (regionIds && regionIds.length > 0) {
    params.set("regionIds", regionIds.join(","))
  }
  if (tahun !== undefined && tahun !== 5) {
    params.set("tahun", String(tahun))
  }
  const qs = params.toString()
  return qs ? `/api/makro?${qs}` : "/api/makro"
}

export const MAX_REGION_SELECTION = 5
export const DEFAULT_WILAYAH_KODE = "14.72"

/**
 * Mengurai parameter `?wilayah=14.72,14,00` terhadap daftar wilayah aktif.
 * Mengembalikan daftar `RegionInfo` (dengan warna cadangan terisi) sesuai urutan
 * kode di query string, dibatasi maksimal 5 wilayah. Bila kosong atau tidak ada
 * yang cocok, dikembalikan wilayah default (`defaultKode`, fallback ke elemen pertama).
 */
export function resolveRegionsFromWilayahParam(
  rawWilayah: string | readonly string[] | undefined | null,
  availableRegions: readonly RegionInfo[],
  defaultKode = DEFAULT_WILAYAH_KODE
): ResolvedRegionInfo[] {
  if (availableRegions.length === 0) return []

  const byKode = new Map(
    availableRegions.map((r) => [r.kode.trim().toLowerCase(), r])
  )

  const rawString: string =
    typeof rawWilayah === "string"
      ? rawWilayah
      : Array.isArray(rawWilayah)
        ? rawWilayah.join(",")
        : ""

  const kodes = rawString
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  const matched: RegionInfo[] = []
  const seenIds = new Set<number>()

  for (const kode of kodes) {
    const found = byKode.get(kode)
    if (found && !seenIds.has(found.id)) {
      seenIds.add(found.id)
      matched.push(found)
      if (matched.length >= MAX_REGION_SELECTION) break
    }
  }

  if (matched.length === 0) {
    const def =
      byKode.get(defaultKode.toLowerCase()) ?? availableRegions[0]
    if (def) matched.push(def)
  }

  return resolveRegionColors(matched)
}

export function formatWilayahQueryParam(
  kodes: readonly string[],
  defaultKode = DEFAULT_WILAYAH_KODE
): string | null {
  const cleaned = Array.from(
    new Set(kodes.map((k) => k.trim()).filter(Boolean))
  ).slice(0, MAX_REGION_SELECTION)

  if (
    cleaned.length === 0 ||
    (cleaned.length === 1 &&
      cleaned[0].toLowerCase() === defaultKode.toLowerCase())
  ) {
    return null
  }
  return cleaned.join(",")
}

export function computeYDomain(
  seri: readonly SeriWilayah[],
  jenisGrafik: "garis" | "batang"
): [number, number] {
  const nilai = seri.flatMap((s) =>
    s.titik.flatMap((t) => (t.nilai === null ? [] : [t.nilai]))
  )
  if (nilai.length === 0) return [0, 1]
  const min = Math.min(...nilai)
  const max = Math.max(...nilai)

  if (jenisGrafik === "batang") {
    const d0 = min < 0 ? min * 1.2 : 0
    const d1 = max > 0 ? max * 1.2 : 0
    return d0 === 0 && d1 === 0 ? [0, 1] : [d0, d1]
  }
  const span = max - min || Math.abs(max) * 0.2 || 1
  return [min - span * 0.4, max + span * 0.5]
}
