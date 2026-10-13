import "server-only";
import { revalidateDisplayCache } from "@/server/services/cache";
import * as settingModel from "@/server/models/setting.model";
import type { UpdateSettingsInput } from "@/lib/schemas/setting.schema";

export async function getSettings(): Promise<Record<string, string>> {
  return settingModel.getMap();
}

export async function updateSettings(
  data: UpdateSettingsInput
): Promise<Record<string, string>> {
  const items: Array<{ key: string; value: string }> = [
    { key: "namaInstansi", value: data.namaInstansi },
    { key: "slogan", value: data.slogan },
    { key: "logoUrl", value: data.logoUrl ?? "" },
  ];

  const updatedMap = await settingModel.setMany(items);
  revalidateDisplayCache();
  return updatedMap;
}
