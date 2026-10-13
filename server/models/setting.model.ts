import "server-only";
import { db } from "@/db";
import { setting } from "@/db/schema";

export async function all(): Promise<Array<{ key: string; value: string }>> {
  return db.select().from(setting);
}

export async function getMap(): Promise<Record<string, string>> {
  const rows = await db.select().from(setting);
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}

export async function setMany(
  items: Array<{ key: string; value: string }>
): Promise<Record<string, string>> {
  for (const item of items) {
    await db
      .insert(setting)
      .values({
        key: item.key,
        value: item.value,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: setting.key,
        set: {
          value: item.value,
          updatedAt: new Date(),
        },
      });
  }
  return getMap();
}
