/**
 * Helper murni (tanpa akses DB) untuk halaman grafik makro ekonomi.
 *
 * Model data: tabel `makro_ekonomi` menyimpan satu baris per (judul, tahun).
 * Baris dikelompokkan berdasarkan `judul`; `nilai` dan `tahun` bertipe teks
 * sehingga diurai di sini.
 */

export type MakroRow = {
  id: number
  judul: string
  nilai: string
  satuan: string
  tahun: string
  tren: string
  urutan: number
  isActive?: boolean
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

export type Indikator = {
  judul: string
  satuan: string
  jenisGrafik: "garis" | "batang"
  /** Tahun data terakhir milik indikator ini (bisa lebih lama dari tahun terbaru global). */
  tahunTerbaru: number
  nilaiTerbaru: string
  delta: {
    arah: Arah
    sentimen: Sentimen
    selisihLabel: string
    tahunPembanding: number
  } | null
  /** Selalu berisi satu titik untuk setiap tahun di jendela (tahunAwal..tahunAkhir). */
  titik: TitikData[]
  urutan: number
}

export type GrafikMakro = {
  tahunAwal: number
  tahunAkhir: number
  indikator: Indikator[]
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

/**
 * Susun data grafik: jendela `jumlahTahun` tahun yang berakhir di tahun
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

    let delta: Indikator["delta"] = null
    if (pembanding && terbaru.nilai !== null && pembanding.nilai !== null) {
      const selisih = terbaru.nilai - pembanding.nilai
      const arah: Arah =
        Math.abs(selisih) < 1e-9 ? "tetap" : selisih > 0 ? "naik" : "turun"
      const tren = parseTren(latestRow.tren)
      // Warna hanya dipercaya jika arah di kolom `tren` sama dengan arah hitungan
      const sentimen: Sentimen = tren.arah === arah ? tren.sentimen : "netral"
      const unit = satuan === "%" ? "poin persentase" : satuan
      delta = {
        arah,
        sentimen,
        selisihLabel: `${formatAngka(Math.abs(selisih))} ${unit}`.trim(),
        tahunPembanding: pembanding.tahun,
      }
    }

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
