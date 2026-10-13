import "server-only";
import { validateJson, validateIdParam, type RouteContext } from "./base";
import {
  createRunningTextSchema,
  updateRunningTextSchema,
  type CreateRunningTextInput,
  type UpdateRunningTextInput,
} from "@/lib/schemas/running-text.schema";

export { validateIdParam, type RouteContext };

export async function parseStoreRunningTextRequest(
  request: Request
): Promise<CreateRunningTextInput> {
  return validateJson(request, createRunningTextSchema, "Validasi data running text gagal");
}

export async function parseUpdateRunningTextRequest(
  request: Request
): Promise<UpdateRunningTextInput> {
  return validateJson(request, updateRunningTextSchema, "Validasi pembaruan running text gagal");
}
