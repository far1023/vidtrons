import "server-only";
import { validateJson, validateIdParam, type RouteContext } from "./base";
import {
  createPromoSchema,
  updatePromoSchema,
  type CreatePromoInput,
  type UpdatePromoInput,
} from "@/lib/schemas/promo.schema";

export { validateIdParam, type RouteContext };

export async function parseStorePromoRequest(
  request: Request
): Promise<CreatePromoInput> {
  return validateJson(request, createPromoSchema, "Validasi data promo gagal");
}

export async function parseUpdatePromoRequest(
  request: Request
): Promise<UpdatePromoInput> {
  return validateJson(request, updatePromoSchema, "Validasi pembaruan promo gagal");
}
