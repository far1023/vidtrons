import "server-only";
import { eq, asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { video } from "@/db/schema";

export type VideoRow = typeof video.$inferSelect;
export type CreateVideoRow = typeof video.$inferInsert;

export async function active(): Promise<VideoRow[]> {
  return db
    .select()
    .from(video)
    .where(eq(video.isActive, true))
    .orderBy(asc(video.urutan), desc(video.createdAt));
}

export async function all(): Promise<VideoRow[]> {
  return db
    .select()
    .from(video)
    .orderBy(asc(video.urutan), desc(video.createdAt));
}

export async function find(id: number): Promise<VideoRow | null> {
  const rows = await db
    .select()
    .from(video)
    .where(eq(video.id, id))
    .limit(1);

  return rows[0] ?? null;
}

export async function create(data: {
  judul: string;
  url: string;
  urutan?: number;
  isActive?: boolean;
}): Promise<VideoRow> {
  const rows = await db
    .insert(video)
    .values({
      judul: data.judul,
      url: data.url,
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
    url: string;
    urutan: number;
    isActive: boolean;
  }>
): Promise<VideoRow | null> {
  const rows = await db
    .update(video)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(video.id, id))
    .returning();

  return rows[0] ?? null;
}

export async function remove(id: number): Promise<boolean> {
  const rows = await db
    .delete(video)
    .where(eq(video.id, id))
    .returning({ id: video.id });

  return rows.length > 0;
}
