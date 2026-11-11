import "server-only"
import { ok, created, noContent } from "@/server/http/response"
import {
  validateIdParam,
  parseListRegionsRequest,
  parseStoreRegionRequest,
  parseUpdateRegionRequest,
  type RouteContext,
} from "@/server/requests/region.request"
import * as regionService from "@/server/services/region.service"
import {
  toRegionResource,
  toRegionCollection,
} from "@/server/resources/region.resource"

/** Public: active regions, filterable by level, parentId and q. */
export async function publicIndex(request: Request): Promise<Response> {
  const filter = parseListRegionsRequest(request)
  const items = await regionService.getActiveRegions(filter)
  return ok(toRegionCollection(items))
}

export async function index(request: Request): Promise<Response> {
  const filter = parseListRegionsRequest(request)
  const items = await regionService.getAllRegions(filter)
  return ok(toRegionCollection(items))
}

export async function show(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context)
  return ok(toRegionResource(await regionService.getRegionById(id)))
}

export async function store(request: Request): Promise<Response> {
  const input = await parseStoreRegionRequest(request)
  const createdItem = await regionService.createRegion(input)
  return created(toRegionResource(createdItem))
}

export async function update(
  request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context)
  const data = await parseUpdateRegionRequest(request)
  return ok(toRegionResource(await regionService.updateRegion(id, data)))
}

export async function destroy(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context)
  await regionService.deleteRegion(id)
  return noContent()
}
