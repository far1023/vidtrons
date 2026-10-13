import "server-only";
import { validateJson, validateIdParam, type RouteContext } from "./base";
import {
  createKategoriSchema,
  updateKategoriSchema,
  type CreateKategoriInput,
  type UpdateKategoriInput,
} from "@/lib/schemas/kategori.schema";

export { validateIdParam, type RouteContext };

export async function parseStoreKategoriRequest(
  request: Request
): Promise<CreateKategoriInput> {
  return validateJson(request, createKategoriSchema, "Validasi data kategori gagal");
}

export async function parseUpdateKategoriRequest(
  request: Request
): Promise<UpdateKategoriInput> {
  return validateJson(request, updateKategoriSchema, "Validasi pembaruan kategori gagal");
}
