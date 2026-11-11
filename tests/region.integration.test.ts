import assert from "node:assert/strict"
import { after, before, describe, it } from "node:test"
import { config } from "dotenv"

config({ path: ".env.local" })

/**
 * Integration tests against the LOCAL dev database (DATABASE_URL in .env.local).
 * They only touch rows whose judul starts with TEST_PREFIX and clean up after.
 * Refuses to run against a remote host.
 */
const TEST_PREFIX = "__t21_test__"

const host = new URL(process.env.DATABASE_URL ?? "postgresql://invalid").hostname
const isLocal = host === "localhost" || host === "127.0.0.1"

describe("regions and makro (local DB)", { skip: !isLocal && "DATABASE_URL is not local" }, () => {
  let regionModel: typeof import("@/server/models/region.model")
  let makroModel: typeof import("@/server/models/makro-ekonomi.model")
  let makroService: typeof import("@/server/services/makro-ekonomi.service")
  let errors: typeof import("@/server/errors/app-error")
  let dumaiId: number
  let pekanbaruId: number
  let db: typeof import("@/db").db
  let schema: typeof import("@/db/schema")
  let like: typeof import("drizzle-orm").like

  async function cleanup() {
    await db.delete(schema.makroEkonomi).where(like(schema.makroEkonomi.judul, `${TEST_PREFIX}%`))
  }

  before(async () => {
    regionModel = await import("@/server/models/region.model")
    makroModel = await import("@/server/models/makro-ekonomi.model")
    makroService = await import("@/server/services/makro-ekonomi.service")
    errors = await import("@/server/errors/app-error")
    db = (await import("@/db")).db
    schema = await import("@/db/schema")
    like = (await import("drizzle-orm")).like
    dumaiId = (await regionModel.findByKode("14.72"))!.id
    pekanbaruId = (await regionModel.findByKode("14.71"))!.id
    await cleanup()
  })

  after(async () => {
    await cleanup()
    process.exit(0) // pg pool keeps the event loop alive
  })

  describe("region.model", () => {
    it("seeded 14 regions with the right hierarchy", async () => {
      const rows = await regionModel.all()
      assert.equal(rows.length, 14)
      const byKode = new Map(rows.map((r) => [r.kode, r]))
      assert.equal(byKode.get("00")!.level, "nasional")
      assert.equal(byKode.get("00")!.parentId, null)
      assert.equal(byKode.get("14")!.parentId, byKode.get("00")!.id)
      for (const r of rows.filter((r) => r.level === "kabkota")) {
        assert.equal(r.parentId, byKode.get("14")!.id, r.kode)
      }
      assert.equal(rows.filter((r) => r.level === "kabkota").length, 12)
      assert.equal(byKode.get("14.72")!.nama, "Kota Dumai")
    })

    it("filters by level, parentId and q (kode or nama, case-insensitive)", async () => {
      assert.equal((await regionModel.all({ level: "provinsi" })).length, 1)
      const riau = (await regionModel.findByKode("14"))!
      assert.equal((await regionModel.all({ parentId: riau.id })).length, 12)
      assert.deepEqual((await regionModel.all({ q: "DUMAI" })).map((r) => r.kode), ["14.72"])
      assert.deepEqual((await regionModel.all({ q: "14.71" })).map((r) => r.kode), ["14.71"])
    })

    it("treats % and _ in q literally", async () => {
      assert.equal((await regionModel.all({ q: "%" })).length, 0)
      assert.equal((await regionModel.all({ q: "_" })).length, 0)
    })

    it("activeOnly hides inactive regions; update changes warna and isActive", async () => {
      const before = await regionModel.find(pekanbaruId)
      try {
        const updated = await regionModel.update(pekanbaruId, { isActive: false, warna: "#123456" })
        assert.equal(updated!.isActive, false)
        assert.equal(updated!.warna, "#123456")
        const active = await regionModel.all({ activeOnly: true })
        assert.equal(active.some((r) => r.id === pekanbaruId), false)
        assert.equal(active.length, 13)
      } finally {
        await regionModel.update(pekanbaruId, { isActive: before!.isActive, warna: before!.warna })
      }
    })

    it("find returns null for an unknown id; findByIds handles empty", async () => {
      assert.equal(await regionModel.find(999999), null)
      assert.deepEqual(await regionModel.findByIds([]), [])
    })

    it("level CHECK constraint rejects unknown levels", async () => {
      await assert.rejects(
        db.insert(schema.regions).values({ kode: "ZZ", nama: "x", level: "desa" })
      )
    })
  })

  describe("makro-ekonomi.model regionIds filter", () => {
    it("create defaults to Kota Dumai when regionId is omitted", async () => {
      const row = await makroModel.create({ judul: `${TEST_PREFIX}default`, nilai: "1", tahun: "2024" })
      assert.equal(row.regionId, dumaiId)
    })

    it("filters by regionIds and returns [] for an empty list", async () => {
      await makroModel.create({ judul: `${TEST_PREFIX}pku`, nilai: "2", tahun: "2024", regionId: pekanbaruId })
      const pku = (await makroModel.all({ regionIds: [pekanbaruId] })).filter((r) =>
        r.judul.startsWith(TEST_PREFIX)
      )
      assert.deepEqual(pku.map((r) => r.judul), [`${TEST_PREFIX}pku`])

      const both = (await makroModel.all({ regionIds: [dumaiId, pekanbaruId] })).filter((r) =>
        r.judul.startsWith(TEST_PREFIX)
      )
      assert.equal(both.length, 2)

      assert.deepEqual(await makroModel.all({ regionIds: [] }), [])
      assert.deepEqual(await makroModel.active({ regionIds: [] }), [])
      assert.ok((await makroModel.all()).length >= 6 + 2) // no filter: every region
    })

    it("active() respects both isActive and regionIds", async () => {
      const row = await makroModel.create({
        judul: `${TEST_PREFIX}inactive`,
        nilai: "3",
        tahun: "2024",
        isActive: false,
        regionId: dumaiId,
      })
      const active = await makroModel.active({ regionIds: [dumaiId] })
      assert.equal(active.some((r) => r.id === row.id), false)
    })
  })

  describe("makro-ekonomi.service", () => {
    it("rejects an unknown regionId with a 422-type ValidationError", async () => {
      await assert.rejects(
        makroService.createMakroEkonomi({
          judul: `${TEST_PREFIX}bad-region`,
          nilai: "1",
          tahun: "2024",
          satuan: "%",
          tren: "tetap",
          urutan: 0,
          isActive: true,
          regionId: 999999,
        }),
        (e: unknown) => e instanceof errors.ValidationError
      )
    })

    it("rejects a duplicate (region, judul, tahun), case-insensitive on judul", async () => {
      const input = {
        judul: `${TEST_PREFIX}Dup`,
        nilai: "1",
        tahun: "2023",
        satuan: "%",
        tren: "tetap" as const,
        urutan: 0,
        isActive: true,
        regionId: dumaiId,
      }
      await makroService.createMakroEkonomi(input)
      await assert.rejects(
        makroService.createMakroEkonomi({ ...input, judul: input.judul.toUpperCase() }),
        (e: unknown) => e instanceof errors.ValidationError
      )
      // Same judul and year in another region is allowed
      await makroService.createMakroEkonomi({ ...input, regionId: pekanbaruId })
    })

    it("update validates regionId and reports duplicates", async () => {
      const a = await makroService.createMakroEkonomi({
        judul: `${TEST_PREFIX}Move`,
        nilai: "1",
        tahun: "2022",
        satuan: "%",
        tren: "tetap",
        urutan: 0,
        isActive: true,
        regionId: dumaiId,
      })
      await assert.rejects(
        makroService.updateMakroEkonomi(a.id, { regionId: 999999 }),
        (e: unknown) => e instanceof errors.ValidationError
      )
      const moved = await makroService.updateMakroEkonomi(a.id, { regionId: pekanbaruId })
      assert.equal(moved.regionId, pekanbaruId)
      await assert.rejects(
        makroService.updateMakroEkonomi(999999, { nilai: "2" }),
        (e: unknown) => e instanceof errors.NotFoundError
      )
    })
  })

  describe("region.controller and route handlers", () => {
    it("handles publicIndex, admin index/show/update, and auth checks", async () => {
      const publicRoute = await import("@/app/api/regions/route")
      const adminListRoute = await import("@/app/api/admin/regions/route")
      const adminIdRoute = await import("@/app/api/admin/regions/[id]/route")

      // 1. GET /api/regions?level=provinsi -> 200
      const resProv = await publicRoute.GET(
        new Request("http://localhost/api/regions?level=provinsi"),
        {}
      )
      assert.equal(resProv.status, 200)
      const bodyProv = await resProv.json()
      assert.equal(bodyProv.data.length, 1)
      assert.equal(bodyProv.data[0].kode, "14")

      // 2. GET /api/regions?level=bogus -> 422
      const resBad = await publicRoute.GET(
        new Request("http://localhost/api/regions?level=bogus"),
        {}
      )
      assert.equal(resBad.status, 422)

      // 3. GET /api/admin/regions without session -> 401
      const resUnauth = await adminListRoute.GET(
        new Request("http://localhost/api/admin/regions"),
        {}
      )
      assert.equal(resUnauth.status, 401)

      // 4. GET /api/admin/regions with dev test auth -> 200
      const authHeaders = { "x-dev-test-auth": "1", "content-type": "application/json" }
      const resAdminList = await adminListRoute.GET(
        new Request("http://localhost/api/admin/regions", { headers: authHeaders }),
        {}
      )
      assert.equal(resAdminList.status, 200)
      const bodyAdminList = await resAdminList.json()
      assert.equal(bodyAdminList.data.length, 14)

      // 5. GET /api/admin/regions/999999 -> 404
      const resNotFound = await adminIdRoute.GET(
        new Request("http://localhost/api/admin/regions/999999", { headers: authHeaders }),
        { params: Promise.resolve({ id: "999999" }) }
      )
      assert.equal(resNotFound.status, 404)

      // 6. PATCH /api/admin/regions/[id] invalid color -> 422
      const resBadPatch = await adminIdRoute.PATCH(
        new Request(`http://localhost/api/admin/regions/${pekanbaruId}`, {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({ warna: "red" }),
        }),
        { params: Promise.resolve({ id: String(pekanbaruId) }) }
      )
      assert.equal(resBadPatch.status, 422)

      // 7. PATCH /api/admin/regions/[id] valid color and restore -> 200
      const resOkPatch = await adminIdRoute.PATCH(
        new Request(`http://localhost/api/admin/regions/${pekanbaruId}`, {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({ warna: "#7c3aed" }),
        }),
        { params: Promise.resolve({ id: String(pekanbaruId) }) }
      )
      assert.equal(resOkPatch.status, 200)
      const bodyOkPatch = await resOkPatch.json()
      assert.equal(bodyOkPatch.data.warna, "#7c3aed")

      await adminIdRoute.PATCH(
        new Request(`http://localhost/api/admin/regions/${pekanbaruId}`, {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({ warna: null }),
        }),
        { params: Promise.resolve({ id: String(pekanbaruId) }) }
      )
    })

    it("serves GET /api/makro multi-region with fallback colors and validates query params", async () => {
      const makroRoute = await import("@/app/api/makro/route")

      // Add a test row for Pekanbaru so we can verify multi-region grouping
      await makroModel.create({
        judul: `${TEST_PREFIX}Indikator Multi`,
        nilai: "6,10",
        tahun: "2023",
        satuan: "%",
        tren: "naik_positif",
        urutan: 0,
        isActive: true,
        regionId: dumaiId,
      })
      await makroModel.create({
        judul: `${TEST_PREFIX}Indikator Multi`,
        nilai: "6,50",
        tahun: "2024",
        satuan: "%",
        tren: "naik_positif",
        urutan: 0,
        isActive: true,
        regionId: dumaiId,
      })
      await makroModel.create({
        judul: `${TEST_PREFIX}Indikator Multi`,
        nilai: "5,90",
        tahun: "2024",
        satuan: "%",
        tren: "naik_positif",
        urutan: 0,
        isActive: true,
        regionId: pekanbaruId,
      })

      // 1. Default GET /api/makro -> Kota Dumai (14.72)
      const resDefault = await makroRoute.GET(
        new Request("http://localhost/api/makro"),
        {}
      )
      assert.equal(resDefault.status, 200)
      const bodyDefault = await resDefault.json()
      assert.equal(bodyDefault.data.regions.length, 1)
      assert.equal(bodyDefault.data.regions[0].kode, "14.72")
      assert.equal(bodyDefault.data.regions[0].warna, "#059669")

      // 2. Multi-region GET /api/makro?regionIds=dumai,pekanbaru&tahun=3
      const resMulti = await makroRoute.GET(
        new Request(
          `http://localhost/api/makro?regionIds=${dumaiId},${pekanbaruId}&tahun=3`
        ),
        {}
      )
      assert.equal(resMulti.status, 200)
      const bodyMulti = await resMulti.json()
      assert.equal(bodyMulti.data.regions.length, 2)
      assert.equal(bodyMulti.data.regions[0].id, dumaiId)
      assert.equal(bodyMulti.data.regions[1].id, pekanbaruId)
      // Pekanbaru has warna=null in DB, so service resolved a fallback hex color
      assert.match(bodyMulti.data.regions[1].warna, /^#[0-9a-fA-F]{6}$/)
      assert.notEqual(
        bodyMulti.data.regions[1].warna,
        bodyMulti.data.regions[0].warna
      )

      const testIndikator = bodyMulti.data.indikator.find(
        (i: { judul: string }) => i.judul === `${TEST_PREFIX}Indikator Multi`
      )
      assert.ok(testIndikator)
      assert.equal(testIndikator.seri.length, 2)
      assert.equal(testIndikator.seri[0].regionId, dumaiId)
      assert.equal(testIndikator.seri[1].regionId, pekanbaruId)

      // 3. Too many regions -> 422
      const resTooMany = await makroRoute.GET(
        new Request("http://localhost/api/makro?regionIds=1,2,3,4,5,6"),
        {}
      )
      assert.equal(resTooMany.status, 422)

      // 4. 5 regions at once (max allowed), including regions without data -> 200
      const allRegions = await regionModel.all({ activeOnly: true })
      const fiveIds = allRegions.slice(0, 5).map((r) => r.id)
      const resFive = await makroRoute.GET(
        new Request(`http://localhost/api/makro?regionIds=${fiveIds.join(",")}`),
        {}
      )
      assert.equal(resFive.status, 200)
      const bodyFive = await resFive.json()
      assert.ok(bodyFive.data === null || bodyFive.data.regions.length === 5)

      // 5. Region without any macro rows (e.g. Kab. Kuansing 14.01) -> 200 with data: null
      const kuansing = (await regionModel.findByKode("14.01"))!
      const resEmptyRegion = await makroRoute.GET(
        new Request(`http://localhost/api/makro?regionIds=${kuansing.id}`),
        {}
      )
      assert.equal(resEmptyRegion.status, 200)
      const bodyEmptyRegion = await resEmptyRegion.json()
      assert.equal(bodyEmptyRegion.data, null)
    })
  })
})

