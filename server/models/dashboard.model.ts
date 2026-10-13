import "server-only";
import { and, asc, count, desc, eq, gte, sql } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { db } from "@/db";
import {
  agenda,
  kategori,
  makroEkonomi,
  pengumuman,
  promo,
  runningText,
  user,
  video,
} from "@/db/schema";

export type ContentCountRow = { total: number; active: number };

/** Total and active row counts for any table that has an `isActive` column. */
async function countContent(
  table: PgTable & { isActive: PgColumn }
): Promise<ContentCountRow> {
  const [row] = await db
    .select({
      total: count(),
      active: sql<number>`count(*) filter (where ${table.isActive})`.mapWith(
        Number
      ),
    })
    .from(table as PgTable);

  return { total: row?.total ?? 0, active: row?.active ?? 0 };
}

export async function contentCounts() {
  const [
    pengumumanCount,
    agendaCount,
    runningTextCount,
    promoCount,
    videoCount,
    makroEkonomiCount,
  ] = await Promise.all([
    countContent(pengumuman),
    countContent(agenda),
    countContent(runningText),
    countContent(promo),
    countContent(video),
    countContent(makroEkonomi),
  ]);

  return {
    pengumuman: pengumumanCount,
    agenda: agendaCount,
    runningText: runningTextCount,
    promo: promoCount,
    video: videoCount,
    makroEkonomi: makroEkonomiCount,
  };
}

export async function userTotal(): Promise<number> {
  const [row] = await db.select({ value: count() }).from(user);
  return row?.value ?? 0;
}

export async function upcomingAgenda(fromDate: string, limit: number) {
  return db
    .select()
    .from(agenda)
    .where(and(eq(agenda.isActive, true), gte(agenda.tanggal, fromDate)))
    .orderBy(asc(agenda.tanggal), asc(agenda.mulai))
    .limit(limit);
}

export async function latestPengumuman(limit: number) {
  return db
    .select({
      id: pengumuman.id,
      judul: pengumuman.judul,
      tanggal: pengumuman.tanggal,
      kategoriNama: kategori.nama,
      kategoriWarna: kategori.warna,
    })
    .from(pengumuman)
    .leftJoin(kategori, eq(pengumuman.kategoriId, kategori.id))
    .where(eq(pengumuman.isActive, true))
    .orderBy(desc(pengumuman.tanggal), desc(pengumuman.id))
    .limit(limit);
}
