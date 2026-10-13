import "server-only";
import { eq, asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { promo } from "@/db/schema";

export type PromoRow = typeof promo.$inferSelect;
export type CreatePromoRow = typeof promo.$inferInsert;

export async function active(): Promise<PromoRow[]> {
  return db
    .select()
    .from(promo)
    .where(eq(promo.isActive, true))
    .orderBy(asc(promo.urutan), desc(promo.createdAt));
}

export async function all(): Promise<PromoRow[]> {
  return db
    .select()
    .from(promo)
    .orderBy(asc(promo.urutan), desc(promo.createdAt));
}

export async function find(id: number): Promise<PromoRow | null> {
  const rows = await db
    .select()
    .from(promo)
    .where(eq(promo.id, id))
    .limit(1);

  return rows[0] ?? null;
}

export async function create(data: {
  judul: string;
  gambarUrl: string;
  urutan?: number;
  isActive?: boolean;
}): Promise<PromoRow> {
  const rows = await db
    .insert(promo)
    .values({
      judul: data.judul,
      gambarUrl: data.gambarUrl,
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
    gambarUrl: string;
    urutan: number;
    isActive: boolean;
  }>
): Promise<PromoRow | null> {
  const rows = await db
    .update(promo)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(promo.id, id))
    .returning();

  return rows[0] ?? null;
}

export async function remove(id: number): Promise<boolean> {
  const rows = await db
    .delete(promo)
    .where(eq(promo.id, id))
    .returning({ id: promo.id });

  return rows.length > 0;
}
