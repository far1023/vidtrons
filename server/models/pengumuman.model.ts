import "server-only";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { pengumuman, kategori } from "@/db/schema";

export type PengumumanRow = typeof pengumuman.$inferSelect;

export interface PengumumanWithKategoriRow {
  id: number;
  judul: string;
  tanggal: string;
  kategoriId: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  kategoriNama: string | null;
  kategoriWarna: string | null;
}

export async function activeWithKategori() {
  return db
    .select({
      id: pengumuman.id,
      judul: pengumuman.judul,
      tanggal: pengumuman.tanggal,
      isActive: pengumuman.isActive,
      createdAt: pengumuman.createdAt,
      kategoriNama: kategori.nama,
      kategoriWarna: kategori.warna,
    })
    .from(pengumuman)
    .leftJoin(kategori, eq(pengumuman.kategoriId, kategori.id))
    .where(eq(pengumuman.isActive, true))
    .orderBy(desc(pengumuman.tanggal), desc(pengumuman.createdAt));
}

export async function allWithKategori(): Promise<PengumumanWithKategoriRow[]> {
  return db
    .select({
      id: pengumuman.id,
      judul: pengumuman.judul,
      tanggal: pengumuman.tanggal,
      kategoriId: pengumuman.kategoriId,
      isActive: pengumuman.isActive,
      createdAt: pengumuman.createdAt,
      updatedAt: pengumuman.updatedAt,
      kategoriNama: kategori.nama,
      kategoriWarna: kategori.warna,
    })
    .from(pengumuman)
    .leftJoin(kategori, eq(pengumuman.kategoriId, kategori.id))
    .orderBy(desc(pengumuman.tanggal), desc(pengumuman.createdAt));
}

export async function find(id: number): Promise<PengumumanWithKategoriRow | null> {
  const rows = await db
    .select({
      id: pengumuman.id,
      judul: pengumuman.judul,
      tanggal: pengumuman.tanggal,
      kategoriId: pengumuman.kategoriId,
      isActive: pengumuman.isActive,
      createdAt: pengumuman.createdAt,
      updatedAt: pengumuman.updatedAt,
      kategoriNama: kategori.nama,
      kategoriWarna: kategori.warna,
    })
    .from(pengumuman)
    .leftJoin(kategori, eq(pengumuman.kategoriId, kategori.id))
    .where(eq(pengumuman.id, id))
    .limit(1);

  return rows[0] ?? null;
}

export async function create(data: {
  judul: string;
  tanggal: string;
  kategoriId?: number | null;
  isActive?: boolean;
}): Promise<PengumumanRow> {
  const rows = await db
    .insert(pengumuman)
    .values({
      judul: data.judul,
      tanggal: data.tanggal,
      kategoriId: data.kategoriId ?? null,
      isActive: data.isActive ?? true,
    })
    .returning();

  return rows[0];
}

export async function update(
  id: number,
  data: Partial<{
    judul: string;
    tanggal: string;
    kategoriId: number | null;
    isActive: boolean;
  }>
): Promise<PengumumanRow | null> {
  const rows = await db
    .update(pengumuman)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(pengumuman.id, id))
    .returning();

  return rows[0] ?? null;
}

export async function remove(id: number): Promise<boolean> {
  const rows = await db
    .delete(pengumuman)
    .where(eq(pengumuman.id, id))
    .returning({ id: pengumuman.id });

  return rows.length > 0;
}
