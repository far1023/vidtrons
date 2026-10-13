import "server-only";
import { validateJson, validateIdParam, type RouteContext } from "./base";
import {
  createMakroEkonomiSchema,
  updateMakroEkonomiSchema,
  type CreateMakroEkonomiInput,
  type UpdateMakroEkonomiInput,
} from "@/lib/schemas/makro-ekonomi.schema";

export { validateIdParam, type RouteContext };

export async function parseStoreMakroEkonomiRequest(
  request: Request
): Promise<CreateMakroEkonomiInput> {
  return validateJson(
    request,
    createMakroEkonomiSchema,
    "Validasi data indikator makro ekonomi gagal"
  );
}

export async function parseUpdateMakroEkonomiRequest(
  request: Request
): Promise<UpdateMakroEkonomiInput> {
  return validateJson(
    request,
    updateMakroEkonomiSchema,
    "Validasi pembaruan indikator makro ekonomi gagal"
  );
}
