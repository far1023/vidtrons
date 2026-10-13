import "server-only";
import { validateJson, validateIdParam, type RouteContext } from "./base";
import {
  createPengumumanSchema,
  updatePengumumanSchema,
  type CreatePengumumanInput,
  type UpdatePengumumanInput,
} from "@/lib/schemas/pengumuman.schema";

export { validateIdParam, type RouteContext };

export async function parseStorePengumumanRequest(
  request: Request
): Promise<CreatePengumumanInput> {
  return validateJson(request, createPengumumanSchema, "Validasi data pengumuman gagal");
}

export async function parseUpdatePengumumanRequest(
  request: Request
): Promise<UpdatePengumumanInput> {
  return validateJson(request, updatePengumumanSchema, "Validasi pembaruan pengumuman gagal");
}
