import "server-only";
import { broadcastPanelUpdate } from "@/server/services/realtime.service";
import * as settingModel from "@/server/models/setting.model";
import type { UpdateSettingsInput } from "@/lib/schemas/setting.schema";

export async function getSettings(): Promise<Record<string, string>> {
  return settingModel.getMap();
}

export async function updateSettings(
  data: UpdateSettingsInput
): Promise<Record<string, string>> {
  const items: Array<{ key: string; value: string }> = [];

  if (data.namaInstansi !== undefined) {
    items.push({ key: "namaInstansi", value: data.namaInstansi });
  }
  if (data.slogan !== undefined) {
    items.push({ key: "slogan", value: data.slogan });
  }
  if (data.logoUrl !== undefined) {
    items.push({ key: "logoUrl", value: data.logoUrl ?? "" });
  }
  if (data.makroQrUrl !== undefined) {
    items.push({ key: "makroQrUrl", value: data.makroQrUrl ?? "" });
  }
  if (data.makroQrLabel !== undefined) {
    items.push({ key: "makroQrLabel", value: data.makroQrLabel ?? "" });
  }

  const updatedMap = await settingModel.setMany(items);
  await broadcastPanelUpdate("setting");
  return updatedMap;
}
