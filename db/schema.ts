import { sql } from "drizzle-orm"
import {
  boolean,
  check,
  date,
  integer,
  pgTable,
  text,
  time,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core"

/**
 * Drizzle schema (docs/SPEC.md "Data model").
 * Media fields are https URL strings: the app never stores files.
 * `date` / `time` columns use string mode (YYYY-MM-DD, HH:mm:ss) so no timezone
 * conversion happens in the driver; all date logic uses DASHBOARD_TIMEZONE.
 */

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}

export const kategori = pgTable("kategori", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nama: varchar("nama", { length: 100 }).notNull(),
  /** Badge color shown on the announcement (CSS color string). */
  warna: varchar("warna", { length: 32 }).notNull(),
  ...timestamps,
})

export const pengumuman = pgTable("pengumuman", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  judul: text("judul").notNull(),
  tanggal: date("tanggal", { mode: "string" }).notNull(),
  kategoriId: integer("kategori_id").references(() => kategori.id, {
    onDelete: "set null",
  }),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
})

export const agenda = pgTable("agenda", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  judul: text("judul").notNull(),
  tanggal: date("tanggal", { mode: "string" }).notNull(),
  mulai: time("mulai").notNull(),
  selesai: time("selesai").notNull(),
  lokasi: text("lokasi").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
})

export const promo = pgTable("promo", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  judul: text("judul").notNull(),
  gambarUrl: text("gambar_url").notNull(),
  urutan: integer("urutan").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
})

export const runningText = pgTable("running_text", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  isi: text("isi").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
})

export const video = pgTable("video", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  judul: text("judul").notNull(),
  url: text("url").notNull(),
  urutan: integer("urutan").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
})

export const makroEkonomi = pgTable("makro_ekonomi", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  judul: varchar("judul", { length: 100 }).notNull(),
  nilai: varchar("nilai", { length: 50 }).notNull(),
  satuan: varchar("satuan", { length: 20 }).notNull().default("%"),
  tahun: varchar("tahun", { length: 20 }).notNull(),
  tren: varchar("tren", { length: 20 }).notNull().default("tetap"), // 'naik_positif' | 'turun_positif' | 'turun_negatif' | 'naik_negatif' | 'tetap' (legacy: 'naik' | 'turun')
  urutan: integer("urutan").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
})

/** Key/value settings: namaInstansi, slogan, logoUrl. */
export const setting = pgTable("setting", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: text("value").notNull(),
  ...timestamps,
})

export const user = pgTable("user", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  ...timestamps,
})
