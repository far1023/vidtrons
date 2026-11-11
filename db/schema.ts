import { sql } from "drizzle-orm"
import {
  type AnyPgColumn,
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
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

/**
 * Administrative regions: nasional (kode "00"), provinsi ("14"), kabupaten/kota
 * ("14.72"), coded per Kemendagri. Seeded inside the migration; only `warna`
 * and `isActive` are edited from the admin panel.
 */
export const regions = pgTable(
  "regions",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    kode: varchar("kode", { length: 10 }).notNull().unique(),
    nama: varchar("nama", { length: 100 }).notNull(),
    level: varchar("level", { length: 10 }).notNull(), // 'nasional' | 'provinsi' | 'kabkota'
    parentId: integer("parent_id").references((): AnyPgColumn => regions.id, {
      onDelete: "restrict",
    }),
    /** Chart color for this region (#RRGGBB); null falls back to the palette. */
    warna: varchar("warna", { length: 32 }),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    check(
      "regions_level_check",
      sql`${t.level} in ('nasional', 'provinsi', 'kabkota')`
    ),
    index("regions_parent_id_idx").on(t.parentId),
    index("regions_level_idx").on(t.level),
  ]
)

export const makroEkonomi = pgTable(
  "makro_ekonomi",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    regionId: integer("region_id")
      .notNull()
      .references(() => regions.id, { onDelete: "restrict" }),
    judul: varchar("judul", { length: 100 }).notNull(),
    nilai: varchar("nilai", { length: 50 }).notNull(),
    satuan: varchar("satuan", { length: 20 }).notNull().default("%"),
    tahun: varchar("tahun", { length: 20 }).notNull(),
    tren: varchar("tren", { length: 20 }).notNull().default("tetap"), // 'naik_positif' | 'turun_positif' | 'turun_negatif' | 'naik_negatif' | 'tetap' (legacy: 'naik' | 'turun')
    urutan: integer("urutan").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("makro_ekonomi_region_judul_tahun_uq").on(
      t.regionId,
      sql`lower(${t.judul})`,
      t.tahun
    ),
    index("makro_ekonomi_region_id_idx").on(t.regionId),
  ]
)

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
