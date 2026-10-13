import "server-only";
import { validateJson, validateIdParam, type RouteContext } from "./base";
import {
  createVideoSchema,
  updateVideoSchema,
  type CreateVideoInput,
  type UpdateVideoInput,
} from "@/lib/schemas/video.schema";

export { validateIdParam, type RouteContext };

export async function parseStoreVideoRequest(
  request: Request
): Promise<CreateVideoInput> {
  return validateJson(request, createVideoSchema, "Validasi data video gagal");
}

export async function parseUpdateVideoRequest(
  request: Request
): Promise<UpdateVideoInput> {
  return validateJson(request, updateVideoSchema, "Validasi pembaruan video gagal");
}
