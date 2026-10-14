import "server-only";
import { eq, and, asc, desc, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { agenda } from "@/db/schema";

export type AgendaRow = typeof agenda.$inferSelect;
export type CreateAgendaRow = typeof agenda.$inferInsert;

export async function today(dateStr: string) {
  return db
    .select()
    .from(agenda)
    .where(and(eq(agenda.tanggal, dateStr), eq(agenda.isActive, true)))
    .orderBy(asc(agenda.mulai));
}

export async function upcoming(startDate: string, endDate: string) {
  return db
    .select()
    .from(agenda)
    .where(
      and(
        gte(agenda.tanggal, startDate),
        lte(agenda.tanggal, endDate),
        eq(agenda.isActive, true)
      )
    )
    .orderBy(asc(agenda.tanggal), asc(agenda.mulai));
}

export async function all(): Promise<AgendaRow[]> {
  return db
    .select()
    .from(agenda)
    .orderBy(desc(agenda.tanggal), asc(agenda.mulai));
}

export async function find(id: number): Promise<AgendaRow | null> {
  const rows = await db
    .select()
    .from(agenda)
    .where(eq(agenda.id, id))
    .limit(1);

  return rows[0] ?? null;
}

export async function create(data: {
  judul: string;
  tanggal: string;
  mulai: string;
  selesai: string;
  lokasi: string;
  isActive?: boolean;
}): Promise<AgendaRow> {
  const rows = await db
    .insert(agenda)
    .values({
      judul: data.judul,
      tanggal: data.tanggal,
      mulai: data.mulai,
      selesai: data.selesai,
      lokasi: data.lokasi,
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
    mulai: string;
    selesai: string;
    lokasi: string;
    isActive: boolean;
  }>
): Promise<AgendaRow | null> {
  const rows = await db
    .update(agenda)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(agenda.id, id))
    .returning();

  return rows[0] ?? null;
}

export async function remove(id: number): Promise<boolean> {
  const rows = await db
    .delete(agenda)
    .where(eq(agenda.id, id))
    .returning({ id: agenda.id });

  return rows.length > 0;
}
