import { config } from "dotenv"
import bcrypt from "bcryptjs"

import { createDb } from "./client"
import * as schema from "./schema"

/**
 * Development seed. WIPES every table, then inserts sample data.
 * Run only against the DEV database: it refuses unless DB_SEED_ALLOWED=true,
 * which must be set in .env.local of the dev machine and never in production.
 * Sample media URLs are public placeholders; replace them in the admin panel.
 */
config({ path: ".env.local" })

async function main() {
  if (process.env.DB_SEED_ALLOWED !== "true") {
    throw new Error("Refusing to seed: set DB_SEED_ALLOWED=true in .env.local (dev only)")
  }
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set (see .env.example)")

  const db = createDb(url)
  const timeZone = process.env.DASHBOARD_TIMEZONE ?? "Asia/Jakarta"
  const today = new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date())

  // Children first because of foreign keys.
  await db.delete(schema.pengumuman)
  await db.delete(schema.kategori)
  await db.delete(schema.agenda)
  await db.delete(schema.promo)
  await db.delete(schema.runningText)
  await db.delete(schema.video)
  await db.delete(schema.makroEkonomi)
  await db.delete(schema.setting)
  await db.delete(schema.user)

  const kategori = await db
    .insert(schema.kategori)
    .values([
      { nama: "Umum", warna: "#047857" },
      { nama: "Penting", warna: "#b45309" },
    ])
    .returning()

  await db.insert(schema.pengumuman).values([
    {
      judul: "Contoh pengumuman umum untuk pengujian tampilan",
      tanggal: today,
      kategoriId: kategori[0].id,
    },
    {
      judul: "Contoh pengumuman penting dengan judul yang cukup panjang agar membungkus ke beberapa baris",
      tanggal: today,
      kategoriId: kategori[1].id,
    },
  ])

  await db.insert(schema.agenda).values([
    {
      judul: "Contoh rapat koordinasi",
      tanggal: today,
      mulai: "09:00",
      selesai: "10:30",
      lokasi: "Ruang Rapat Utama",
    },
    {
      judul: "Contoh sosialisasi program",
      tanggal: today,
      mulai: "13:00",
      selesai: "15:00",
      lokasi: "Aula",
    },
  ])

  await db.insert(schema.promo).values([
    { judul: "Promo contoh 1", gambarUrl: "https://placehold.co/1080x1350/png?text=Promo+1", urutan: 1 },
    { judul: "Promo contoh 2", gambarUrl: "https://placehold.co/1080x1350/png?text=Promo+2", urutan: 2 },
    { judul: "Promo contoh 3", gambarUrl: "https://placehold.co/1080x1350/png?text=Promo+3", urutan: 3 },
  ])

  await db.insert(schema.runningText).values([
    { isi: "Contoh teks berjalan pertama" },
    { isi: "Contoh teks berjalan kedua" },
  ])

  await db.insert(schema.video).values([
    {
      judul: "Video contoh",
      url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      urutan: 1,
    },
  ])

  await db.insert(schema.makroEkonomi).values([
    {
      judul: "Pertumbuhan Ekonomi",
      nilai: "5,21",
      satuan: "%",
      tahun: "2024",
      tren: "naik_positif",
      urutan: 1,
    },
    {
      judul: "Inflasi Tahunan",
      nilai: "2,14",
      satuan: "%",
      tahun: "2024",
      tren: "turun_positif",
      urutan: 2,
    },
    {
      judul: "Indeks Pembangunan Manusia (IPM)",
      nilai: "76,40",
      satuan: "Poin",
      tahun: "2024",
      tren: "naik_positif",
      urutan: 3,
    },
    {
      judul: "Tingkat Pengangguran Terbuka (TPT)",
      nilai: "5,82",
      satuan: "%",
      tahun: "2024",
      tren: "turun_positif",
      urutan: 4,
    },
    {
      judul: "Tingkat Kemiskinan",
      nilai: "3,11",
      satuan: "%",
      tahun: "2024",
      tren: "turun_positif",
      urutan: 5,
    },
    {
      judul: "PDRB ADHB",
      nilai: "128,5",
      satuan: "Triliun Rp",
      tahun: "2024",
      tren: "naik_positif",
      urutan: 6,
    },
  ])

  await db.insert(schema.setting).values([
    { key: "namaInstansi", value: "Bappeda" },
    { key: "slogan", value: "Contoh slogan instansi" },
    { key: "logoUrl", value: "https://placehold.co/200x200/png?text=Logo" },
    { key: "makroQrUrl", value: "https://placehold.co/400x400/png?text=QR+Makro" },
    { key: "makroQrLabel", value: "Satu Data Kota Dumai" },
  ])

  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  if (adminEmail && adminPassword) {
    await db.insert(schema.user).values({
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
    })
  } else {
    console.log("ADMIN_EMAIL / ADMIN_PASSWORD not set: skipped the admin user")
  }

  console.log("Seed finished")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
