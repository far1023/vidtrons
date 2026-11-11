import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  createRegionSchema,
  listRegionsQuerySchema,
  updateRegionSchema,
} from "@/lib/schemas/region.schema"
import {
  createMakroEkonomiSchema,
  updateMakroEkonomiSchema,
} from "@/lib/schemas/makro-ekonomi.schema"
import {
  parseListRegionsRequest,
  parseStoreRegionRequest,
  parseUpdateRegionRequest,
} from "@/server/requests/region.request"
import { ValidationError } from "@/server/errors/app-error"

describe("createRegionSchema & updateRegionSchema", () => {
  it("createRegionSchema validates kode, nama, level, parentId, warna, and defaults", () => {
    const parsed = createRegionSchema.parse({
      kode: " 13.71 ",
      nama: " Kota Padang ",
      level: "kabkota",
      parentId: 2,
      warna: "#059669",
    })
    assert.deepEqual(parsed, {
      kode: "13.71",
      nama: "Kota Padang",
      level: "kabkota",
      parentId: 2,
      warna: "#059669",
      isActive: true,
    })

    // Defaults parentId and warna to null, isActive to true
    const minimal = createRegionSchema.parse({
      kode: "13",
      nama: "Provinsi Sumatera Barat",
      level: "provinsi",
    })
    assert.deepEqual(minimal, {
      kode: "13",
      nama: "Provinsi Sumatera Barat",
      level: "provinsi",
      parentId: null,
      warna: null,
      isActive: true,
    })
  })

  it("createRegionSchema rejects invalid kode, empty nama, or invalid level", () => {
    assert.equal(
      createRegionSchema.safeParse({ kode: "", nama: "X", level: "kabkota" }).success,
      false
    )
    assert.equal(
      createRegionSchema.safeParse({ kode: "14/72", nama: "X", level: "kabkota" }).success,
      false
    )
    assert.equal(
      createRegionSchema.safeParse({ kode: "14.72", nama: "   ", level: "kabkota" }).success,
      false
    )
    assert.equal(
      createRegionSchema.safeParse({ kode: "14.72", nama: "X", level: "kecamatan" }).success,
      false
    )
  })

  it("updateRegionSchema accepts partial updates for kode, nama, level, parentId, warna, and isActive", () => {
    assert.ok(updateRegionSchema.safeParse({ warna: "#7c3aed" }).success)
    assert.ok(updateRegionSchema.safeParse({ warna: null }).success)
    assert.ok(updateRegionSchema.safeParse({ isActive: false }).success)
    assert.ok(
      updateRegionSchema.safeParse({
        kode: "14.72",
        nama: "Kota Dumai",
        level: "kabkota",
        parentId: 2,
      }).success
    )
    assert.ok(updateRegionSchema.safeParse({}).success)
  })

  it("updateRegionSchema rejects malformed colors or invalid fields", () => {
    for (const warna of ["red", "#fff", "7c3aed", "#7c3aedaa", "#gggggg", ""]) {
      assert.equal(updateRegionSchema.safeParse({ warna }).success, false, warna)
    }
    assert.equal(updateRegionSchema.safeParse({ kode: "bad kode!" }).success, false)
    assert.equal(updateRegionSchema.safeParse({ parentId: 0 }).success, false)
  })
})

describe("listRegionsQuerySchema", () => {
  it("accepts valid filters and coerces parentId", () => {
    const r = listRegionsQuerySchema.parse({ level: "kabkota", parentId: "2", q: " dumai " })
    assert.deepEqual(r, { level: "kabkota", parentId: 2, q: "dumai" })
  })

  it("rejects bad level, parentId and overlong q", () => {
    assert.equal(listRegionsQuerySchema.safeParse({ level: "desa" }).success, false)
    assert.equal(listRegionsQuerySchema.safeParse({ parentId: "abc" }).success, false)
    assert.equal(listRegionsQuerySchema.safeParse({ parentId: "0" }).success, false)
    assert.equal(listRegionsQuerySchema.safeParse({ q: "a".repeat(51) }).success, false)
  })
})

describe("makro-ekonomi schema regionId", () => {
  const base = { regionId: 3, judul: "Inflasi", nilai: "2,1", tahun: "2024" }

  it("regionId is required on create and validated", () => {
    assert.ok(createMakroEkonomiSchema.safeParse(base).success)
    assert.equal(
      createMakroEkonomiSchema.safeParse({ judul: "Inflasi", nilai: "2,1", tahun: "2024" }).success,
      false
    )
    for (const regionId of [0, -1, 1.5, "3"]) {
      assert.equal(createMakroEkonomiSchema.safeParse({ ...base, regionId }).success, false, String(regionId))
    }
  })

  it("update accepts regionId", () => {
    assert.ok(updateMakroEkonomiSchema.safeParse({ regionId: 2 }).success)
    assert.equal(updateMakroEkonomiSchema.safeParse({ regionId: 0 }).success, false)
  })
})

describe("region requests", () => {
  it("parseListRegionsRequest reads the query string", () => {
    const q = parseListRegionsRequest(new Request("http://x/api/regions?level=provinsi&q=riau"))
    assert.deepEqual(q, { level: "provinsi", q: "riau" })
  })

  it("parseListRegionsRequest throws ValidationError with field details", () => {
    assert.throws(
      () => parseListRegionsRequest(new Request("http://x/api/regions?level=bogus")),
      (e: unknown) => e instanceof ValidationError
    )
  })

  it("parseStoreRegionRequest validates new region payload", async () => {
    const post = (body: string) =>
      new Request("http://x", {
        method: "POST",
        body,
        headers: { "content-type": "application/json" },
      })
    await assert.rejects(parseStoreRegionRequest(post("not json")), ValidationError)
    await assert.rejects(
      parseStoreRegionRequest(post('{"kode":"","nama":"X","level":"kabkota"}')),
      ValidationError
    )
    const okData = await parseStoreRegionRequest(
      post('{"kode":"14.99","nama":"Kota Baru","level":"kabkota","parentId":2}')
    )
    assert.deepEqual(okData, {
      kode: "14.99",
      nama: "Kota Baru",
      level: "kabkota",
      parentId: 2,
      warna: null,
      isActive: true,
    })
  })

  it("parseUpdateRegionRequest rejects invalid JSON and bad color", async () => {
    const patch = (body: string) =>
      new Request("http://x", {
        method: "PATCH",
        body,
        headers: { "content-type": "application/json" },
      })
    await assert.rejects(parseUpdateRegionRequest(patch("not json")), ValidationError)
    await assert.rejects(parseUpdateRegionRequest(patch('{"warna":"red"}')), ValidationError)
    assert.deepEqual(await parseUpdateRegionRequest(patch('{"warna":"#aabbcc"}')), {
      warna: "#aabbcc",
    })
  })
})
