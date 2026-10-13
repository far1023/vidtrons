import "server-only";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { runningText } from "@/db/schema";

export type RunningTextRow = typeof runningText.$inferSelect;
export type CreateRunningTextRow = typeof runningText.$inferInsert;

export async function all(): Promise<RunningTextRow[]> {
  return db
    .select()
    .from(runningText)
    .orderBy(desc(runningText.createdAt));
}

export async function active(): Promise<RunningTextRow[]> {
  return db
    .select()
    .from(runningText)
    .where(eq(runningText.isActive, true))
    .orderBy(desc(runningText.createdAt));
}

export async function find(id: number): Promise<RunningTextRow | null> {
  const rows = await db
    .select()
    .from(runningText)
    .where(eq(runningText.id, id))
    .limit(1);

  return rows[0] ?? null;
}

export async function create(data: {
  isi: string;
  isActive?: boolean;
}): Promise<RunningTextRow> {
  const rows = await db
    .insert(runningText)
    .values({
      isi: data.isi,
      isActive: data.isActive ?? true,
    })
    .returning();

  return rows[0];
}

export async function update(
  id: number,
  data: Partial<{ isi: string; isActive: boolean }>
): Promise<RunningTextRow | null> {
  const rows = await db
    .update(runningText)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(runningText.id, id))
    .returning();

  return rows[0] ?? null;
}

export async function remove(id: number): Promise<boolean> {
  const rows = await db
    .delete(runningText)
    .where(eq(runningText.id, id))
    .returning({ id: runningText.id });

  return rows.length > 0;
}
