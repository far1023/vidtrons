import "server-only"
import {
  validateJson,
  validateIdParam,
  validateQueryParams,
  type RouteContext,
} from "./base"
import {
  createRegionSchema,
  updateRegionSchema,
  listRegionsQuerySchema,
  type CreateRegionInput,
  type UpdateRegionInput,
  type ListRegionsQuery,
} from "@/lib/schemas/region.schema"

export { validateIdParam, type RouteContext }

export function parseListRegionsRequest(request: Request): ListRegionsQuery {
  return validateQueryParams(
    request,
    listRegionsQuerySchema,
    "Parameter pencarian wilayah tidak valid"
  )
}

export async function parseStoreRegionRequest(
  request: Request
): Promise<CreateRegionInput> {
  return validateJson(
    request,
    createRegionSchema,
    "Validasi data wilayah gagal"
  )
}

export async function parseUpdateRegionRequest(
  request: Request
): Promise<UpdateRegionInput> {
  return validateJson(
    request,
    updateRegionSchema,
    "Validasi pembaruan wilayah gagal"
  )
}
