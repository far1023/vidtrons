import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  buildGrafikMakro,
  buildGrafikMakroMulti,
  buildMakroEndpointUrl,
  computeYDomain,
  formatWilayahQueryParam,
  parseNilai,
  parseTahun,
  parseTren,
  pivotSeriByTahun,
  resolveRegionColors,
  resolveRegionsFromWilayahParam,
  REGION_FALLBACK_PALETTE,
  type MakroRow,
  type RegionInfo,
} from "@/lib/makro-ekonomi"
import { grafikMakroQuerySchema } from "@/lib/schemas/makro-ekonomi.schema"
import { parseGrafikMakroRequest } from "@/server/requests/makro-ekonomi.request"
import { ValidationError } from "@/server/errors/app-error"

describe("parseNilai, parseTahun, parseTren", () => {
  it("parses Indonesian numbers accurately", () => {
    assert.equal(parseNilai("5,21"), 5.21)
    assert.equal(parseNilai("1.234,5"), 1234.5)
    assert.equal(parseNilai("128,5"), 128.5)
    assert.equal(parseNilai("1.234"), 1234)
    assert.equal(parseNilai("−2,5 %"), -2.5)
    assert.equal(parseNilai("abc"), null)
  })

  it("extracts 4-digit year", () => {
    assert.equal(parseTahun("2024"), 2024)
    assert.equal(parseTahun("Tahun 2023 (TW IV)"), 2023)
    assert.equal(parseTahun("99"), null)
  })

  it("maps tren strings to arah and sentimen", () => {
    assert.deepEqual(parseTren("naik_positif"), {
      arah: "naik",
      sentimen: "positif",
    })
    assert.deepEqual(parseTren("turun_positif"), {
      arah: "turun",
      sentimen: "positif",
    })
    assert.deepEqual(parseTren("naik_negatif"), {
      arah: "naik",
      sentimen: "negatif",
    })
    assert.deepEqual(parseTren("tetap"), { arah: "tetap", sentimen: "netral" })
  })
})

describe("resolveRegionColors", () => {
  it("preserves explicit warna and assigns non-colliding fallback palette colors in order", () => {
    const regions: RegionInfo[] = [
      {
        id: 14,
        kode: "14.72",
        nama: "Kota Dumai",
        level: "kabkota",
        warna: "#059669",
      },
      {
        id: 13,
        kode: "14.71",
        nama: "Kota Pekanbaru",
        level: "kabkota",
        warna: null,
      },
      {
        id: 2,
        kode: "14",
        nama: "Provinsi Riau",
        level: "provinsi",
        warna: "#1d4ed8",
      },
      {
        id: 3,
        kode: "14.01",
        nama: "Kab. Kuansing",
        level: "kabkota",
        warna: null,
      },
    ]
    const resolved = resolveRegionColors(regions)
    assert.equal(resolved[0].warna, "#059669")
    // #059669 (idx 0) and #1d4ed8 (idx 1) are already used by explicit regions, so fallback picks idx 2 and idx 3
    assert.equal(resolved[1].warna, REGION_FALLBACK_PALETTE[2])
    assert.equal(resolved[2].warna, "#1d4ed8")
    assert.equal(resolved[3].warna, REGION_FALLBACK_PALETTE[3])
  })
})

describe("buildGrafikMakroMulti and pivotSeriByTahun", () => {
  const regions: RegionInfo[] = [
    {
      id: 14,
      kode: "14.72",
      nama: "Kota Dumai",
      level: "kabkota",
      warna: "#059669",
    },
    {
      id: 2,
      kode: "14",
      nama: "Provinsi Riau",
      level: "provinsi",
      warna: "#1d4ed8",
    },
    {
      id: 1,
      kode: "00",
      nama: "Nasional",
      level: "nasional",
      warna: "#b91c1c",
    },
  ]

  const rows: MakroRow[] = [
    {
      id: 1,
      regionId: 14,
      judul: "Pertumbuhan Ekonomi",
      nilai: "4,80",
      satuan: "%",
      tahun: "2023",
      tren: "naik_positif",
      urutan: 1,
      isActive: true,
    },
    {
      id: 2,
      regionId: 14,
      judul: "Pertumbuhan Ekonomi",
      nilai: "5,21",
      satuan: "%",
      tahun: "2024",
      tren: "naik_positif",
      urutan: 1,
      isActive: true,
    },
    {
      id: 3,
      regionId: 2,
      judul: "pertumbuhan  ekonomi",
      nilai: "4,21",
      satuan: "%",
      tahun: "2024",
      tren: "naik_positif",
      urutan: 1,
      isActive: true,
    },
    {
      id: 4,
      regionId: 14,
      judul: "PDRB ADHB",
      nilai: "128,5",
      satuan: "Triliun Rp",
      tahun: "2024",
      tren: "naik_positif",
      urutan: 2,
      isActive: true,
    },
  ]

  it("groups by normalized judul and preserves requested region order", () => {
    const res = buildGrafikMakroMulti(rows, regions, 3)
    assert.ok(res)
    assert.equal(res.tahunAwal, 2022)
    assert.equal(res.tahunAkhir, 2024)
    assert.equal(res.regions.length, 3)
    assert.equal(res.indikator.length, 2)

    const pe = res.indikator[0]
    assert.equal(pe.judul, "Pertumbuhan Ekonomi")
    assert.equal(pe.jenisGrafik, "garis")
    // Nasional has no rows for Pertumbuhan Ekonomi, so seri contains Dumai (14) then Riau (2)
    assert.deepEqual(
      pe.seri.map((s) => s.regionId),
      [14, 2]
    )
    assert.equal(pe.seri[0].nilaiTerbaru, "5,21")
    assert.ok(pe.seri[0].delta)
    assert.equal(pe.seri[0].delta.arah, "naik")
    assert.equal(pe.seri[0].delta.tahunPembanding, 2023)

    const pdrb = res.indikator[1]
    assert.equal(pdrb.jenisGrafik, "garis")
    assert.deepEqual(
      pdrb.seri.map((s) => s.regionId),
      [14]
    )
  })

  it("pivots series by year for Recharts consumption", () => {
    const res = buildGrafikMakroMulti(rows, regions, 3)!
    const pivoted = pivotSeriByTahun(
      res.indikator[0].seri,
      res.tahunAwal,
      res.tahunAkhir
    )
    assert.equal(pivoted.length, 3)
    assert.deepEqual(pivoted[0], {
      tahun: 2022,
      r14: null,
      r14_label: null,
      r2: null,
      r2_label: null,
    })
    assert.deepEqual(pivoted[1], {
      tahun: 2023,
      r14: 4.8,
      r14_label: "4,80",
      r2: null,
      r2_label: null,
    })
    assert.deepEqual(pivoted[2], {
      tahun: 2024,
      r14: 5.21,
      r14_label: "5,21",
      r2: 4.21,
      r2_label: "4,21",
    })
  })

  it("skips a region series when its latest year row is inactive, and keeps single-series buildGrafikMakro working", () => {
    const withInactive: MakroRow[] = [
      ...rows,
      {
        id: 99,
        regionId: 2,
        judul: "Pertumbuhan Ekonomi",
        nilai: "4,50",
        satuan: "%",
        tahun: "2024",
        tren: "naik_positif",
        urutan: 1,
        isActive: false,
      },
    ]
    const multi = buildGrafikMakroMulti(withInactive, regions, 3)!
    assert.deepEqual(
      multi.indikator[0].seri.map((s) => s.regionId),
      [14]
    )

    const single = buildGrafikMakro(
      rows.filter((r) => r.regionId === 14),
      3
    )
    assert.ok(single)
    assert.equal(single.indikator.length, 2)
  })
})

describe("grafikMakroQuerySchema & parseGrafikMakroRequest", () => {
  it("parses comma-separated regionIds, deduplicates, and defaults tahun to 5", () => {
    const q = grafikMakroQuerySchema.parse({ regionIds: "14, 2, 14, 1" })
    assert.deepEqual(q, { regionIds: [14, 2, 1], tahun: 5 })

    const empty = grafikMakroQuerySchema.parse({})
    assert.deepEqual(empty, { tahun: 5 })
  })

  it("rejects more than 5 regions, non-numeric IDs, or out-of-range tahun", () => {
    assert.equal(
      grafikMakroQuerySchema.safeParse({ regionIds: "1,2,3,4,5,6" }).success,
      false
    )
    assert.equal(
      grafikMakroQuerySchema.safeParse({ regionIds: "1,abc" }).success,
      false
    )
    assert.equal(
      grafikMakroQuerySchema.safeParse({ regionIds: "0" }).success,
      false
    )
    assert.equal(
      grafikMakroQuerySchema.safeParse({ tahun: "0" }).success,
      false
    )
    assert.equal(
      grafikMakroQuerySchema.safeParse({ tahun: "25" }).success,
      false
    )
    assert.throws(
      () =>
        parseGrafikMakroRequest(
          new Request("http://x/api/makro?regionIds=1,2,3,4,5,6")
        ),
      (e: unknown) => e instanceof ValidationError
    )
  })
})

describe("buildMakroEndpointUrl and computeYDomain (T23)", () => {
  it("builds endpoint URL for default, single, and multiple regions", () => {
    assert.equal(buildMakroEndpointUrl(), "/api/makro")
    assert.equal(buildMakroEndpointUrl([]), "/api/makro")
    assert.equal(buildMakroEndpointUrl([14]), "/api/makro?regionIds=14")
    assert.equal(
      buildMakroEndpointUrl([14, 2, 1], 3),
      "/api/makro?regionIds=14%2C2%2C1&tahun=3"
    )
    assert.equal(
      buildMakroEndpointUrl([14], 5),
      "/api/makro?regionIds=14"
    )
  })

  it("computes combined Y domain across multiple region series", () => {
    const seri = [
      {
        regionId: 14,
        tahunTerbaru: 2024,
        nilaiTerbaru: "5,2",
        delta: null,
        titik: [
          { tahun: 2023, nilai: 4.0, nilaiLabel: "4,0" },
          { tahun: 2024, nilai: 5.2, nilaiLabel: "5,2" },
        ],
      },
      {
        regionId: 2,
        tahunTerbaru: 2024,
        nilaiTerbaru: "8,0",
        delta: null,
        titik: [
          { tahun: 2023, nilai: null, nilaiLabel: null },
          { tahun: 2024, nilai: 8.0, nilaiLabel: "8,0" },
        ],
      },
    ]

    const lineDomain = computeYDomain(seri, "garis")
    assert.ok(Math.abs(lineDomain[0] - 2.4) < 1e-9)
    assert.ok(Math.abs(lineDomain[1] - 10.0) < 1e-9)

    const barDomain = computeYDomain(seri, "batang")
    assert.equal(barDomain[0], 0)
    assert.ok(Math.abs(barDomain[1] - 9.6) < 1e-9)
  })
})

describe("resolveRegionsFromWilayahParam & formatWilayahQueryParam (T24)", () => {
  const available: RegionInfo[] = [
    { id: 1, kode: "00", nama: "Nasional", level: "nasional", warna: "#b91c1c" },
    { id: 2, kode: "14", nama: "Provinsi Riau", level: "provinsi", warna: "#1d4ed8" },
    { id: 3, kode: "14.01", nama: "Kab. Kuansing", level: "kabkota", warna: null },
    { id: 4, kode: "14.02", nama: "Kab. Inhu", level: "kabkota", warna: null },
    { id: 5, kode: "14.03", nama: "Kab. Inhil", level: "kabkota", warna: null },
    { id: 13, kode: "14.71", nama: "Kota Pekanbaru", level: "kabkota", warna: null },
    { id: 14, kode: "14.72", nama: "Kota Dumai", level: "kabkota", warna: "#059669" },
  ]

  it("defaults to Kota Dumai (14.72) when param is empty or has no valid codes", () => {
    const def1 = resolveRegionsFromWilayahParam(null, available)
    assert.deepEqual(def1.map((r) => r.kode), ["14.72"])

    const def2 = resolveRegionsFromWilayahParam("99.99,xx", available)
    assert.deepEqual(def2.map((r) => r.kode), ["14.72"])
  })

  it("preserves user order, deduplicates, ignores unknown codes, and caps at 5 regions", () => {
    const res = resolveRegionsFromWilayahParam(
      "14.72, 14, 00, 14.72, 99.99, 14.71, 14.01, 14.02",
      available
    )
    assert.deepEqual(
      res.map((r) => r.kode),
      ["14.72", "14", "00", "14.71", "14.01"]
    )
    // Fallback colors are resolved on every returned region
    for (const r of res) {
      assert.match(r.warna, /^#[0-9a-fA-F]{6}$/)
    }
  })

  it("formatWilayahQueryParam omits query param when selection is only the default region", () => {
    assert.equal(formatWilayahQueryParam([]), null)
    assert.equal(formatWilayahQueryParam(["14.72"]), null)
    assert.equal(
      formatWilayahQueryParam(["14.72", "14", "00"]),
      "14.72,14,00"
    )
    assert.equal(formatWilayahQueryParam(["14"]), "14")
  })
})

describe("T26 verification: 1 vs 5 regions, empty data, and regions without data", () => {
  const fiveRegions: RegionInfo[] = [
    { id: 14, kode: "14.72", nama: "Kota Dumai", level: "kabkota", warna: "#059669" },
    { id: 2, kode: "14", nama: "Provinsi Riau", level: "provinsi", warna: "#1d4ed8" },
    { id: 1, kode: "00", nama: "Nasional", level: "nasional", warna: "#b91c1c" },
    { id: 13, kode: "14.71", nama: "Kota Pekanbaru", level: "kabkota", warna: null },
    { id: 5, kode: "14.03", nama: "Kabupaten Bengkalis", level: "kabkota", warna: null },
  ]

  it("handles 1 region vs 5 regions (including regions with no rows or partial years)", () => {
    const rows: MakroRow[] = [
      // Dumai: 2022, 2023, 2024
      { id: 1, regionId: 14, judul: "IPM", nilai: "74,90", satuan: "Poin", tahun: "2022", tren: "naik_positif", urutan: 1, isActive: true },
      { id: 2, regionId: 14, judul: "IPM", nilai: "75,40", satuan: "Poin", tahun: "2023", tren: "naik_positif", urutan: 1, isActive: true },
      { id: 3, regionId: 14, judul: "IPM", nilai: "75,90", satuan: "Poin", tahun: "2024", tren: "naik_positif", urutan: 1, isActive: true },
      // Riau: 2023, 2024
      { id: 4, regionId: 2, judul: "IPM", nilai: "74,00", satuan: "Poin", tahun: "2023", tren: "naik_positif", urutan: 1, isActive: true },
      { id: 5, regionId: 2, judul: "IPM", nilai: "74,50", satuan: "Poin", tahun: "2024", tren: "naik_positif", urutan: 1, isActive: true },
      // Nasional: 2024 only
      { id: 6, regionId: 1, judul: "IPM", nilai: "75,02", satuan: "Poin", tahun: "2024", tren: "naik_positif", urutan: 1, isActive: true },
      // Pekanbaru: 2023, 2024
      { id: 7, regionId: 13, judul: "IPM", nilai: "82,00", satuan: "Poin", tahun: "2023", tren: "naik_positif", urutan: 1, isActive: true },
      { id: 8, regionId: 13, judul: "IPM", nilai: "82,60", satuan: "Poin", tahun: "2024", tren: "naik_positif", urutan: 1, isActive: true },
      // Bengkalis (id=5) deliberately has NO rows at all
    ]

    // 1. Single region (Kota Dumai)
    const single = buildGrafikMakroMulti(rows, [fiveRegions[0]], 5)
    assert.ok(single)
    assert.equal(single.regions.length, 1)
    assert.equal(single.indikator.length, 1)
    assert.equal(single.indikator[0].seri.length, 1)
    assert.equal(single.indikator[0].seri[0].regionId, 14)
    assert.equal(single.indikator[0].seri[0].titik.length, 5)

    // 2. Five regions (4 have data, 1 has no data)
    const multi5 = buildGrafikMakroMulti(rows, fiveRegions, 5)
    assert.ok(multi5)
    assert.equal(multi5.regions.length, 5)
    // Distinct hex colors assigned to all 5 regions
    const uniqueColors = new Set(multi5.regions.map((r) => r.warna.toLowerCase()))
    assert.equal(uniqueColors.size, 5)

    const ipm = multi5.indikator[0]
    // Series only include the 4 regions that actually have data, in the requested region order
    assert.deepEqual(
      ipm.seri.map((s) => s.regionId),
      [14, 2, 1, 13]
    )
    // Nasional only has 1 year of data, so its delta is null
    assert.equal(ipm.seri[2].delta, null)

    // Pivot produces 5 rows (2020..2024) with keys for each series
    const pivoted = pivotSeriByTahun(ipm.seri, multi5.tahunAwal, multi5.tahunAkhir)
    assert.equal(pivoted.length, 5)
    const row2024 = pivoted[4]
    assert.equal(row2024.tahun, 2024)
    assert.equal(row2024.r14, 75.9)
    assert.equal(row2024.r2, 74.5)
    assert.equal(row2024.r1, 75.02)
    assert.equal(row2024.r13, 82.6)
  })

  it("handles empty rows, empty regions, and selected regions that have zero matching data", () => {
    // Empty rows -> null
    assert.equal(buildGrafikMakroMulti([], fiveRegions, 5), null)
    // Empty regions -> null
    assert.equal(
      buildGrafikMakroMulti(
        [{ id: 1, regionId: 14, judul: "IPM", nilai: "75,90", satuan: "Poin", tahun: "2024", tren: "tetap", urutan: 1 }],
        [],
        5
      ),
      null
    )
    // Selected region has no rows (only Bengkalis id=5 selected, while data is for Dumai id=14) -> null
    assert.equal(
      buildGrafikMakroMulti(
        [{ id: 1, regionId: 14, judul: "IPM", nilai: "75,90", satuan: "Poin", tahun: "2024", tren: "tetap", urutan: 1 }],
        [fiveRegions[4]],
        5
      ),
      null
    )
    // computeYDomain on empty series returns safe [0, 1] fallback
    assert.deepEqual(computeYDomain([], "garis"), [0, 1])
    assert.deepEqual(computeYDomain([], "batang"), [0, 1])
  })
})
