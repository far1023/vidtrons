import "server-only";
import { and, eq, asc, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { makroEkonomi, regions } from "@/db/schema";

export type MakroEkonomiRow = typeof makroEkonomi.$inferSelect;
export type CreateMakroEkonomiRow = typeof makroEkonomi.$inferInsert;

export type MakroFilter = {
  /** Restrict to these regions; undefined means every region. */
  regionIds?: number[];
};

function regionCondition(filter: MakroFilter) {
  return filter.regionIds
    ? inArray(makroEkonomi.regionId, filter.regionIds)
    : undefined;
}

export async function all(
  filter: MakroFilter = {}
): Promise<MakroEkonomiRow[]> {
  if (filter.regionIds?.length === 0) return [];
  return db
    .select()
    .from(makroEkonomi)
    .where(regionCondition(filter))
    .orderBy(asc(makroEkonomi.urutan), asc(makroEkonomi.id));
}

export async function active(
  filter: MakroFilter = {}
): Promise<MakroEkonomiRow[]> {
  if (filter.regionIds?.length === 0) return [];
  return db
    .select()
    .from(makroEkonomi)
    .where(and(eq(makroEkonomi.isActive, true), regionCondition(filter)))
    .orderBy(asc(makroEkonomi.urutan), asc(makroEkonomi.id));
}

export async function find(id: number): Promise<MakroEkonomiRow | null> {
  const rows = await db
    .select()
    .from(makroEkonomi)
    .where(eq(makroEkonomi.id, id))
    .limit(1);

  return rows[0] ?? null;
}

export type MakroTren =
  | "naik_positif"
  | "turun_positif"
  | "turun_negatif"
  | "naik_negatif"
  | "tetap"
  | "naik"
  | "turun";

export async function create(data: {
  regionId?: number;
  judul: string;
  nilai: string;
  satuan?: string;
  tahun: string;
  tren?: MakroTren;
  urutan?: number;
  isActive?: boolean;
}): Promise<MakroEkonomiRow> {
  const rows = await db
    .insert(makroEkonomi)
    .values({
      // Until T25 adds region input to the admin form, new rows default to Kota Dumai (14.72).
      regionId:
        data.regionId ??
        sql`(select ${regions.id} from ${regions} where ${regions.kode} = '14.72')`,
      judul: data.judul,
      nilai: data.nilai,
      satuan: data.satuan ?? "%",
      tahun: data.tahun,
      tren: data.tren ?? "tetap",
      urutan: data.urutan ?? 0,
      isActive: data.isActive ?? true,
    })
    .returning();

  return rows[0];
}

export async function update(
  id: number,
  data: Partial<{
    regionId: number;
    judul: string;
    nilai: string;
    satuan: string;
    tahun: string;
    tren: MakroTren;
    urutan: number;
    isActive: boolean;
  }>
): Promise<MakroEkonomiRow | null> {
  const rows = await db
    .update(makroEkonomi)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(makroEkonomi.id, id))
    .returning();

  return rows[0] ?? null;
}

export async function remove(id: number): Promise<boolean> {
  const rows = await db
    .delete(makroEkonomi)
    .where(eq(makroEkonomi.id, id))
    .returning({ id: makroEkonomi.id });

  return rows.length > 0;
}
