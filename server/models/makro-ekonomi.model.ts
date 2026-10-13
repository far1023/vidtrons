import "server-only";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { makroEkonomi } from "@/db/schema";

export type MakroEkonomiRow = typeof makroEkonomi.$inferSelect;
export type CreateMakroEkonomiRow = typeof makroEkonomi.$inferInsert;

export async function all(): Promise<MakroEkonomiRow[]> {
  return db
    .select()
    .from(makroEkonomi)
    .orderBy(asc(makroEkonomi.urutan), asc(makroEkonomi.id));
}

export async function active(): Promise<MakroEkonomiRow[]> {
  return db
    .select()
    .from(makroEkonomi)
    .where(eq(makroEkonomi.isActive, true))
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
