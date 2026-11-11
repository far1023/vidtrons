import "server-only";
import { and, asc, eq, ilike, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { regions } from "@/db/schema";
import type {
  CreateRegionInput,
  UpdateRegionInput,
} from "@/lib/schemas/region.schema";

export type RegionRow = typeof regions.$inferSelect;
export type RegionLevel = "nasional" | "provinsi" | "kabkota";

export type RegionFilter = {
  level?: RegionLevel;
  parentId?: number;
  /** Case-insensitive match on `nama` or `kode`. */
  q?: string;
  activeOnly?: boolean;
};

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

export async function all(filter: RegionFilter = {}): Promise<RegionRow[]> {
  const conditions = [];
  if (filter.level) conditions.push(eq(regions.level, filter.level));
  if (filter.parentId !== undefined) {
    conditions.push(eq(regions.parentId, filter.parentId));
  }
  if (filter.activeOnly) conditions.push(eq(regions.isActive, true));
  if (filter.q) {
    const pattern = `%${escapeLike(filter.q)}%`;
    conditions.push(
      sql`(${ilike(regions.nama, pattern)} or ${ilike(regions.kode, pattern)})`
    );
  }

  // Kode sorts nasional, provinsi, then kab/kota in natural Kemendagri order.
  return db
    .select()
    .from(regions)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(regions.kode));
}

export async function find(id: number): Promise<RegionRow | null> {
  const rows = await db
    .select()
    .from(regions)
    .where(eq(regions.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function findByIds(ids: number[]): Promise<RegionRow[]> {
  if (ids.length === 0) return [];
  return db.select().from(regions).where(inArray(regions.id, ids));
}

export async function findByKode(kode: string): Promise<RegionRow | null> {
  const rows = await db
    .select()
    .from(regions)
    .where(eq(regions.kode, kode))
    .limit(1);
  return rows[0] ?? null;
}

export async function create(data: CreateRegionInput): Promise<RegionRow> {
  const rows = await db
    .insert(regions)
    .values({
      kode: data.kode,
      nama: data.nama,
      level: data.level,
      parentId: data.parentId ?? null,
      warna: data.warna ?? null,
      isActive: data.isActive ?? true,
    })
    .returning();
  return rows[0];
}

export async function update(
  id: number,
  data: UpdateRegionInput
): Promise<RegionRow | null> {
  const rows = await db
    .update(regions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(regions.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function remove(id: number): Promise<boolean> {
  const rows = await db
    .delete(regions)
    .where(eq(regions.id, id))
    .returning({ id: regions.id });
  return rows.length > 0;
}
