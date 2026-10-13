import "server-only";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { kategori } from "@/db/schema";

export type KategoriRow = typeof kategori.$inferSelect;
export type CreateKategoriRow = typeof kategori.$inferInsert;

export async function all(): Promise<KategoriRow[]> {
  return db
    .select()
    .from(kategori)
    .orderBy(asc(kategori.nama));
}

export async function find(id: number): Promise<KategoriRow | null> {
  const rows = await db
    .select()
    .from(kategori)
    .where(eq(kategori.id, id))
    .limit(1);

  return rows[0] ?? null;
}

export async function create(data: {
  nama: string;
  warna: string;
}): Promise<KategoriRow> {
  const rows = await db
    .insert(kategori)
    .values({
      nama: data.nama,
      warna: data.warna,
    })
    .returning();

  return rows[0];
}

export async function update(
  id: number,
  data: Partial<{ nama: string; warna: string }>
): Promise<KategoriRow | null> {
  const rows = await db
    .update(kategori)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(kategori.id, id))
    .returning();

  return rows[0] ?? null;
}

export async function remove(id: number): Promise<boolean> {
  const rows = await db
    .delete(kategori)
    .where(eq(kategori.id, id))
    .returning({ id: kategori.id });

  return rows.length > 0;
}
