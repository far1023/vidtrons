import "server-only";
import { validateJson } from "./base";
import {
  updateSettingsSchema,
  type UpdateSettingsInput,
} from "@/lib/schemas/setting.schema";

export async function parseUpdateSettingsRequest(
  request: Request
): Promise<UpdateSettingsInput> {
  return validateJson(request, updateSettingsSchema, "Validasi data pengaturan gagal");
}
