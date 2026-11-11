import "server-only"
import {
  validateJson,
  validateIdParam,
  validateQueryParams,
  type RouteContext,
} from "./base"
import {
  createMakroEkonomiSchema,
  updateMakroEkonomiSchema,
  grafikMakroQuerySchema,
  type CreateMakroEkonomiInput,
  type UpdateMakroEkonomiInput,
  type GrafikMakroQuery,
} from "@/lib/schemas/makro-ekonomi.schema"

export { validateIdParam, type RouteContext }

export function parseGrafikMakroRequest(request: Request): GrafikMakroQuery {
  return validateQueryParams(
    request,
    grafikMakroQuerySchema,
    "Parameter query grafik makro ekonomi tidak valid"
  )
}

export async function parseStoreMakroEkonomiRequest(
  request: Request
): Promise<CreateMakroEkonomiInput> {
  return validateJson(
    request,
    createMakroEkonomiSchema,
    "Validasi data indikator makro ekonomi gagal"
  )
}

export async function parseUpdateMakroEkonomiRequest(
  request: Request
): Promise<UpdateMakroEkonomiInput> {
  return validateJson(
    request,
    updateMakroEkonomiSchema,
    "Validasi pembaruan indikator makro ekonomi gagal"
  )
}
