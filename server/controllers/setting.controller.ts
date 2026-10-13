import "server-only";
import { ok } from "@/server/http/response";
import { parseUpdateSettingsRequest } from "@/server/requests/setting.request";
import * as settingService from "@/server/services/setting.service";
import { toSettingsResource } from "@/server/resources/setting.resource";

export async function show(_request: Request): Promise<Response> {
  const map = await settingService.getSettings();
  return ok(toSettingsResource(map));
}

export async function update(request: Request): Promise<Response> {
  const input = await parseUpdateSettingsRequest(request);
  const updatedMap = await settingService.updateSettings(input);
  return ok(toSettingsResource(updatedMap));
}
