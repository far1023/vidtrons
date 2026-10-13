import "server-only";
import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";

export type UserRow = typeof user.$inferSelect;

export async function all(): Promise<UserRow[]> {
  return db.select().from(user).orderBy(asc(user.id));
}

export async function find(id: number): Promise<UserRow | null> {
  const rows = await db.select().from(user).where(eq(user.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function findByEmail(email: string): Promise<UserRow | null> {
  const rows = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  return rows[0] ?? null;
}

export async function total(): Promise<number> {
  const [row] = await db.select({ value: count() }).from(user);
  return row?.value ?? 0;
}

export async function create(data: {
  email: string;
  passwordHash: string;
}): Promise<UserRow> {
  const rows = await db.insert(user).values(data).returning();
  return rows[0];
}

export async function update(
  id: number,
  data: Partial<{ email: string; passwordHash: string }>
): Promise<UserRow | null> {
  const rows = await db
    .update(user)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(user.id, id))
    .returning();

  return rows[0] ?? null;
}

export async function remove(id: number): Promise<boolean> {
  const rows = await db
    .delete(user)
    .where(eq(user.id, id))
    .returning({ id: user.id });

  return rows.length > 0;
}
