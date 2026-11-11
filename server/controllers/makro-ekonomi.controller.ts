import "server-only"
import { ok, created, noContent } from "@/server/http/response"
import { validateIdParam, type RouteContext } from "@/server/requests/base"
import {
  parseStoreMakroEkonomiRequest,
  parseUpdateMakroEkonomiRequest,
  parseGrafikMakroRequest,
} from "@/server/requests/makro-ekonomi.request"
import * as makroEkonomiService from "@/server/services/makro-ekonomi.service"
import * as grafikMakroService from "@/server/services/grafik-makro-ekonomi.service"
import { revalidateMakroCache } from "@/server/services/cache"
import {
  toMakroEkonomiResource,
  toMakroEkonomiCollection,
  toGrafikMakroMultiResource,
} from "@/server/resources/makro-ekonomi.resource"

/** Public: multi-region macro chart data (`GET /api/makro`). */
export async function publicGrafik(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const forceFresh =
    url.searchParams.get("refresh") === "1" ||
    url.searchParams.get("refresh") === "true"
  if (forceFresh) {
    revalidateMakroCache()
  }
  const query = parseGrafikMakroRequest(request)
  const data = await grafikMakroService.getGrafikMakroMulti({
    ...query,
    forceFresh,
  })
  return ok(toGrafikMakroMultiResource(data))
}

export async function index(_request: Request): Promise<Response> {
  const items = await makroEkonomiService.getAllMakroEkonomi()
  return ok(toMakroEkonomiCollection(items))
}

/** Admin: clear macro/region/display caches and repopulate from DB (`POST /api/admin/makro-ekonomi/refresh`). */
export async function refresh(_request: Request): Promise<Response> {
  const items = await makroEkonomiService.refreshMakroEkonomi()
  return ok(toMakroEkonomiCollection(items))
}

export async function show(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context)
  const item = await makroEkonomiService.getMakroEkonomiById(id)
  return ok(toMakroEkonomiResource(item))
}

export async function store(request: Request): Promise<Response> {
  const input = await parseStoreMakroEkonomiRequest(request)
  const createdItem = await makroEkonomiService.createMakroEkonomi(input)
  return created(toMakroEkonomiResource(createdItem))
}

export async function update(
  request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context)
  const data = await parseUpdateMakroEkonomiRequest(request)
  const updatedItem = await makroEkonomiService.updateMakroEkonomi(id, data)
  return ok(toMakroEkonomiResource(updatedItem))
}

export async function destroy(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context)
  await makroEkonomiService.deleteMakroEkonomi(id)
  return noContent()
}
