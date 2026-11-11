import path from "node:path"
import { fileURLToPath } from "node:url"
import { config } from "dotenv"
import { eq, ilike, or } from "drizzle-orm"

import { createDb, type Db } from "./client"
import * as schema from "./schema"

/**
 * Seeds ONLY the `makro_ekonomi` table (75 rows from `docs/MACRO-DATA.md`:
 * 5 indicators × 3 regions [Kota Dumai, Riau, Nasional] × years 2021–2025).
 * Ensures the required target regions exist in `regions` without deleting
 * any other tables.
 */
export async function seedMakroEkonomi(db: Db) {
  let [nasional] = await db
    .select()
    .from(schema.regions)
    .where(
      or(eq(schema.regions.kode, "00"), ilike(schema.regions.nama, "Nasional"))
    )
  if (!nasional) {
    ;[nasional] = await db
      .insert(schema.regions)
      .values({
        kode: "00",
        nama: "Nasional",
        level: "nasional",
        parentId: null,
        warna: "#b91c1c",
      })
      .returning()
  }

  let [riau] = await db
    .select()
    .from(schema.regions)
    .where(
      or(
        eq(schema.regions.kode, "14"),
        ilike(schema.regions.nama, "Riau"),
        ilike(schema.regions.nama, "Provinsi Riau")
      )
    )
  if (!riau) {
    ;[riau] = await db
      .insert(schema.regions)
      .values({
        kode: "14",
        nama: "Provinsi Riau",
        level: "provinsi",
        parentId: nasional.id,
        warna: "#1d4ed8",
      })
      .returning()
  }

  let [dumai] = await db
    .select()
    .from(schema.regions)
    .where(
      or(
        eq(schema.regions.kode, "14.72"),
        ilike(schema.regions.nama, "Kota Dumai")
      )
    )
  if (!dumai) {
    ;[dumai] = await db
      .insert(schema.regions)
      .values({
        kode: "14.72",
        nama: "Kota Dumai",
        level: "kabkota",
        parentId: riau.id,
        warna: "#059669",
      })
      .returning()
  }

  await db.delete(schema.makroEkonomi)

  const rows: (typeof schema.makroEkonomi.$inferInsert)[] = [
    // 1. Laju Pertumbuhan Ekonomi - Kota Dumai
    {
      regionId: dumai.id,
      judul: "Laju Pertumbuhan Ekonomi",
      nilai: "5,98",
      satuan: "%",
      tahun: "2021",
      tren: "tetap",
      urutan: 1,
      isActive: false,
    },
    {
      regionId: dumai.id,
      judul: "Laju Pertumbuhan Ekonomi",
      nilai: "6,36",
      satuan: "%",
      tahun: "2022",
      tren: "naik_positif",
      urutan: 2,
      isActive: false,
    },
    {
      regionId: dumai.id,
      judul: "Laju Pertumbuhan Ekonomi",
      nilai: "6,05",
      satuan: "%",
      tahun: "2023",
      tren: "turun_negatif",
      urutan: 3,
      isActive: false,
    },
    {
      regionId: dumai.id,
      judul: "Laju Pertumbuhan Ekonomi",
      nilai: "5,02",
      satuan: "%",
      tahun: "2024",
      tren: "turun_negatif",
      urutan: 4,
      isActive: false,
    },
    {
      regionId: dumai.id,
      judul: "Laju Pertumbuhan Ekonomi",
      nilai: "5,55",
      satuan: "%",
      tahun: "2025",
      tren: "naik_positif",
      urutan: 5,
      isActive: true,
    },
    // 1. Laju Pertumbuhan Ekonomi - Riau
    {
      regionId: riau.id,
      judul: "Laju Pertumbuhan Ekonomi",
      nilai: "3,78",
      satuan: "%",
      tahun: "2021",
      tren: "tetap",
      urutan: 1,
      isActive: false,
    },
    {
      regionId: riau.id,
      judul: "Laju Pertumbuhan Ekonomi",
      nilai: "4,55",
      satuan: "%",
      tahun: "2022",
      tren: "naik_positif",
      urutan: 2,
      isActive: false,
    },
    {
      regionId: riau.id,
      judul: "Laju Pertumbuhan Ekonomi",
      nilai: "4,21",
      satuan: "%",
      tahun: "2023",
      tren: "turun_negatif",
      urutan: 3,
      isActive: false,
    },
    {
      regionId: riau.id,
      judul: "Laju Pertumbuhan Ekonomi",
      nilai: "3,52",
      satuan: "%",
      tahun: "2024",
      tren: "turun_negatif",
      urutan: 4,
      isActive: false,
    },
    {
      regionId: riau.id,
      judul: "Laju Pertumbuhan Ekonomi",
      nilai: "4,79",
      satuan: "%",
      tahun: "2025",
      tren: "naik_positif",
      urutan: 5,
      isActive: true,
    },
    // 1. Laju Pertumbuhan Ekonomi - Nasional
    {
      regionId: nasional.id,
      judul: "Laju Pertumbuhan Ekonomi",
      nilai: "3,69",
      satuan: "%",
      tahun: "2021",
      tren: "tetap",
      urutan: 1,
      isActive: false,
    },
    {
      regionId: nasional.id,
      judul: "Laju Pertumbuhan Ekonomi",
      nilai: "5,31",
      satuan: "%",
      tahun: "2022",
      tren: "naik_positif",
      urutan: 2,
      isActive: false,
    },
    {
      regionId: nasional.id,
      judul: "Laju Pertumbuhan Ekonomi",
      nilai: "5,05",
      satuan: "%",
      tahun: "2023",
      tren: "turun_negatif",
      urutan: 3,
      isActive: false,
    },
    {
      regionId: nasional.id,
      judul: "Laju Pertumbuhan Ekonomi",
      nilai: "5,03",
      satuan: "%",
      tahun: "2024",
      tren: "turun_negatif",
      urutan: 4,
      isActive: false,
    },
    {
      regionId: nasional.id,
      judul: "Laju Pertumbuhan Ekonomi",
      nilai: "5,11",
      satuan: "%",
      tahun: "2025",
      tren: "naik_positif",
      urutan: 5,
      isActive: true,
    },

    // 2. Tingkat Kemiskinan - Kota Dumai
    {
      regionId: dumai.id,
      judul: "Tingkat Kemiskinan",
      nilai: "3,42",
      satuan: "%",
      tahun: "2021",
      tren: "tetap",
      urutan: 1,
      isActive: false,
    },
    {
      regionId: dumai.id,
      judul: "Tingkat Kemiskinan",
      nilai: "3,20",
      satuan: "%",
      tahun: "2022",
      tren: "turun_positif",
      urutan: 2,
      isActive: false,
    },
    {
      regionId: dumai.id,
      judul: "Tingkat Kemiskinan",
      nilai: "3,21",
      satuan: "%",
      tahun: "2023",
      tren: "naik_negatif",
      urutan: 3,
      isActive: false,
    },
    {
      regionId: dumai.id,
      judul: "Tingkat Kemiskinan",
      nilai: "3,14",
      satuan: "%",
      tahun: "2024",
      tren: "turun_positif",
      urutan: 4,
      isActive: false,
    },
    {
      regionId: dumai.id,
      judul: "Tingkat Kemiskinan",
      nilai: "3,08",
      satuan: "%",
      tahun: "2025",
      tren: "turun_positif",
      urutan: 5,
      isActive: true,
    },
    // 2. Tingkat Kemiskinan - Riau
    {
      regionId: riau.id,
      judul: "Tingkat Kemiskinan",
      nilai: "7,12",
      satuan: "%",
      tahun: "2021",
      tren: "tetap",
      urutan: 1,
      isActive: false,
    },
    {
      regionId: riau.id,
      judul: "Tingkat Kemiskinan",
      nilai: "6,78",
      satuan: "%",
      tahun: "2022",
      tren: "turun_positif",
      urutan: 2,
      isActive: false,
    },
    {
      regionId: riau.id,
      judul: "Tingkat Kemiskinan",
      nilai: "6,68",
      satuan: "%",
      tahun: "2023",
      tren: "turun_positif",
      urutan: 3,
      isActive: false,
    },
    {
      regionId: riau.id,
      judul: "Tingkat Kemiskinan",
      nilai: "6,67",
      satuan: "%",
      tahun: "2024",
      tren: "turun_positif",
      urutan: 4,
      isActive: false,
    },
    {
      regionId: riau.id,
      judul: "Tingkat Kemiskinan",
      nilai: "6,16",
      satuan: "%",
      tahun: "2025",
      tren: "turun_positif",
      urutan: 5,
      isActive: true,
    },
    // 2. Tingkat Kemiskinan - Nasional
    {
      regionId: nasional.id,
      judul: "Tingkat Kemiskinan",
      nilai: "9,71",
      satuan: "%",
      tahun: "2021",
      tren: "tetap",
      urutan: 1,
      isActive: false,
    },
    {
      regionId: nasional.id,
      judul: "Tingkat Kemiskinan",
      nilai: "9,57",
      satuan: "%",
      tahun: "2022",
      tren: "turun_positif",
      urutan: 2,
      isActive: false,
    },
    {
      regionId: nasional.id,
      judul: "Tingkat Kemiskinan",
      nilai: "9,36",
      satuan: "%",
      tahun: "2023",
      tren: "turun_positif",
      urutan: 3,
      isActive: false,
    },
    {
      regionId: nasional.id,
      judul: "Tingkat Kemiskinan",
      nilai: "9,03",
      satuan: "%",
      tahun: "2024",
      tren: "turun_positif",
      urutan: 4,
      isActive: false,
    },
    {
      regionId: nasional.id,
      judul: "Tingkat Kemiskinan",
      nilai: "8,47",
      satuan: "%",
      tahun: "2025",
      tren: "turun_positif",
      urutan: 5,
      isActive: true,
    },

    // 3. Tingkat Pengangguran Terbuka - Kota Dumai
    {
      regionId: dumai.id,
      judul: "Tingkat Pengangguran Terbuka",
      nilai: "6,29",
      satuan: "%",
      tahun: "2021",
      tren: "tetap",
      urutan: 1,
      isActive: false,
    },
    {
      regionId: dumai.id,
      judul: "Tingkat Pengangguran Terbuka",
      nilai: "5,38",
      satuan: "%",
      tahun: "2022",
      tren: "turun_positif",
      urutan: 2,
      isActive: false,
    },
    {
      regionId: dumai.id,
      judul: "Tingkat Pengangguran Terbuka",
      nilai: "5,15",
      satuan: "%",
      tahun: "2023",
      tren: "turun_positif",
      urutan: 3,
      isActive: false,
    },
    {
      regionId: dumai.id,
      judul: "Tingkat Pengangguran Terbuka",
      nilai: "4,66",
      satuan: "%",
      tahun: "2024",
      tren: "turun_positif",
      urutan: 4,
      isActive: false,
    },
    {
      regionId: dumai.id,
      judul: "Tingkat Pengangguran Terbuka",
      nilai: "4,51",
      satuan: "%",
      tahun: "2025",
      tren: "turun_positif",
      urutan: 5,
      isActive: true,
    },
    // 3. Tingkat Pengangguran Terbuka - Riau
    {
      regionId: riau.id,
      judul: "Tingkat Pengangguran Terbuka",
      nilai: "4,42",
      satuan: "%",
      tahun: "2021",
      tren: "tetap",
      urutan: 1,
      isActive: false,
    },
    {
      regionId: riau.id,
      judul: "Tingkat Pengangguran Terbuka",
      nilai: "4,37",
      satuan: "%",
      tahun: "2022",
      tren: "turun_positif",
      urutan: 2,
      isActive: false,
    },
    {
      regionId: riau.id,
      judul: "Tingkat Pengangguran Terbuka",
      nilai: "4,23",
      satuan: "%",
      tahun: "2023",
      tren: "turun_positif",
      urutan: 3,
      isActive: false,
    },
    {
      regionId: riau.id,
      judul: "Tingkat Pengangguran Terbuka",
      nilai: "3,70",
      satuan: "%",
      tahun: "2024",
      tren: "turun_positif",
      urutan: 4,
      isActive: false,
    },
    {
      regionId: riau.id,
      judul: "Tingkat Pengangguran Terbuka",
      nilai: "4,16",
      satuan: "%",
      tahun: "2025",
      tren: "naik_negatif",
      urutan: 5,
      isActive: true,
    },
    // 3. Tingkat Pengangguran Terbuka - Nasional
    {
      regionId: nasional.id,
      judul: "Tingkat Pengangguran Terbuka",
      nilai: "6,49",
      satuan: "%",
      tahun: "2021",
      tren: "tetap",
      urutan: 1,
      isActive: false,
    },
    {
      regionId: nasional.id,
      judul: "Tingkat Pengangguran Terbuka",
      nilai: "5,86",
      satuan: "%",
      tahun: "2022",
      tren: "turun_positif",
      urutan: 2,
      isActive: false,
    },
    {
      regionId: nasional.id,
      judul: "Tingkat Pengangguran Terbuka",
      nilai: "5,32",
      satuan: "%",
      tahun: "2023",
      tren: "turun_positif",
      urutan: 3,
      isActive: false,
    },
    {
      regionId: nasional.id,
      judul: "Tingkat Pengangguran Terbuka",
      nilai: "4,91",
      satuan: "%",
      tahun: "2024",
      tren: "turun_positif",
      urutan: 4,
      isActive: false,
    },
    {
      regionId: nasional.id,
      judul: "Tingkat Pengangguran Terbuka",
      nilai: "4,85",
      satuan: "%",
      tahun: "2025",
      tren: "turun_positif",
      urutan: 5,
      isActive: true,
    },

    // 4. Indeks Pembangunan Manusia - Kota Dumai
    {
      regionId: dumai.id,
      judul: "Indeks Pembangunan Manusia",
      nilai: "74,75",
      satuan: "Indeks",
      tahun: "2021",
      tren: "tetap",
      urutan: 1,
      isActive: false,
    },
    {
      regionId: dumai.id,
      judul: "Indeks Pembangunan Manusia",
      nilai: "75,26",
      satuan: "Indeks",
      tahun: "2022",
      tren: "naik_positif",
      urutan: 2,
      isActive: false,
    },
    {
      regionId: dumai.id,
      judul: "Indeks Pembangunan Manusia",
      nilai: "76,45",
      satuan: "Indeks",
      tahun: "2023",
      tren: "naik_positif",
      urutan: 3,
      isActive: false,
    },
    {
      regionId: dumai.id,
      judul: "Indeks Pembangunan Manusia",
      nilai: "77,03",
      satuan: "Indeks",
      tahun: "2024",
      tren: "naik_positif",
      urutan: 4,
      isActive: false,
    },
    {
      regionId: dumai.id,
      judul: "Indeks Pembangunan Manusia",
      nilai: "77,58",
      satuan: "Indeks",
      tahun: "2025",
      tren: "naik_positif",
      urutan: 5,
      isActive: true,
    },
    // 4. Indeks Pembangunan Manusia - Riau
    {
      regionId: riau.id,
      judul: "Indeks Pembangunan Manusia",
      nilai: "73,89",
      satuan: "Indeks",
      tahun: "2021",
      tren: "tetap",
      urutan: 1,
      isActive: false,
    },
    {
      regionId: riau.id,
      judul: "Indeks Pembangunan Manusia",
      nilai: "75,45",
      satuan: "Indeks",
      tahun: "2022",
      tren: "naik_positif",
      urutan: 2,
      isActive: false,
    },
    {
      regionId: riau.id,
      judul: "Indeks Pembangunan Manusia",
      nilai: "74,95",
      satuan: "Indeks",
      tahun: "2023",
      tren: "turun_negatif",
      urutan: 3,
      isActive: false,
    },
    {
      regionId: riau.id,
      judul: "Indeks Pembangunan Manusia",
      nilai: "75,67",
      satuan: "Indeks",
      tahun: "2024",
      tren: "naik_positif",
      urutan: 4,
      isActive: false,
    },
    {
      regionId: riau.id,
      judul: "Indeks Pembangunan Manusia",
      nilai: "76,31",
      satuan: "Indeks",
      tahun: "2025",
      tren: "naik_positif",
      urutan: 5,
      isActive: true,
    },
    // 4. Indeks Pembangunan Manusia - Nasional
    {
      regionId: nasional.id,
      judul: "Indeks Pembangunan Manusia",
      nilai: "73,16",
      satuan: "Indeks",
      tahun: "2021",
      tren: "tetap",
      urutan: 1,
      isActive: false,
    },
    {
      regionId: nasional.id,
      judul: "Indeks Pembangunan Manusia",
      nilai: "73,77",
      satuan: "Indeks",
      tahun: "2022",
      tren: "naik_positif",
      urutan: 2,
      isActive: false,
    },
    {
      regionId: nasional.id,
      judul: "Indeks Pembangunan Manusia",
      nilai: "74,39",
      satuan: "Indeks",
      tahun: "2023",
      tren: "naik_positif",
      urutan: 3,
      isActive: false,
    },
    {
      regionId: nasional.id,
      judul: "Indeks Pembangunan Manusia",
      nilai: "75,02",
      satuan: "Indeks",
      tahun: "2024",
      tren: "naik_positif",
      urutan: 4,
      isActive: false,
    },
    {
      regionId: nasional.id,
      judul: "Indeks Pembangunan Manusia",
      nilai: "75,9",
      satuan: "Indeks",
      tahun: "2025",
      tren: "naik_positif",
      urutan: 5,
      isActive: true,
    },

    // 5. Indeks Gini - Kota Dumai
    {
      regionId: dumai.id,
      judul: "Indeks Gini",
      nilai: "0,345",
      satuan: "Indeks",
      tahun: "2021",
      tren: "tetap",
      urutan: 1,
      isActive: false,
    },
    {
      regionId: dumai.id,
      judul: "Indeks Gini",
      nilai: "0,324",
      satuan: "Indeks",
      tahun: "2022",
      tren: "turun_positif",
      urutan: 2,
      isActive: false,
    },
    {
      regionId: dumai.id,
      judul: "Indeks Gini",
      nilai: "0,310",
      satuan: "Indeks",
      tahun: "2023",
      tren: "turun_positif",
      urutan: 3,
      isActive: false,
    },
    {
      regionId: dumai.id,
      judul: "Indeks Gini",
      nilai: "0,328",
      satuan: "Indeks",
      tahun: "2024",
      tren: "naik_negatif",
      urutan: 4,
      isActive: false,
    },
    {
      regionId: dumai.id,
      judul: "Indeks Gini",
      nilai: "0,321",
      satuan: "Indeks",
      tahun: "2025",
      tren: "turun_positif",
      urutan: 5,
      isActive: true,
    },
    // 5. Indeks Gini - Riau
    {
      regionId: riau.id,
      judul: "Indeks Gini",
      nilai: "0,327",
      satuan: "Indeks",
      tahun: "2021",
      tren: "tetap",
      urutan: 1,
      isActive: false,
    },
    {
      regionId: riau.id,
      judul: "Indeks Gini",
      nilai: "0,323",
      satuan: "Indeks",
      tahun: "2022",
      tren: "turun_positif",
      urutan: 2,
      isActive: false,
    },
    {
      regionId: riau.id,
      judul: "Indeks Gini",
      nilai: "0,324",
      satuan: "Indeks",
      tahun: "2023",
      tren: "naik_negatif",
      urutan: 3,
      isActive: false,
    },
    {
      regionId: riau.id,
      judul: "Indeks Gini",
      nilai: "0,307",
      satuan: "Indeks",
      tahun: "2024",
      tren: "turun_positif",
      urutan: 4,
      isActive: false,
    },
    {
      regionId: riau.id,
      judul: "Indeks Gini",
      nilai: "0,304",
      satuan: "Indeks",
      tahun: "2025",
      tren: "turun_positif",
      urutan: 5,
      isActive: true,
    },
    // 5. Indeks Gini - Nasional
    {
      regionId: nasional.id,
      judul: "Indeks Gini",
      nilai: "0,381",
      satuan: "Indeks",
      tahun: "2021",
      tren: "tetap",
      urutan: 1,
      isActive: false,
    },
    {
      regionId: nasional.id,
      judul: "Indeks Gini",
      nilai: "0,381",
      satuan: "Indeks",
      tahun: "2022",
      tren: "tetap",
      urutan: 2,
      isActive: false,
    },
    {
      regionId: nasional.id,
      judul: "Indeks Gini",
      nilai: "0,388",
      satuan: "Indeks",
      tahun: "2023",
      tren: "naik_negatif",
      urutan: 3,
      isActive: false,
    },
    {
      regionId: nasional.id,
      judul: "Indeks Gini",
      nilai: "0,379",
      satuan: "Indeks",
      tahun: "2024",
      tren: "turun_positif",
      urutan: 4,
      isActive: false,
    },
    {
      regionId: nasional.id,
      judul: "Indeks Gini",
      nilai: "0,363",
      satuan: "Indeks",
      tahun: "2025",
      tren: "turun_positif",
      urutan: 5,
      isActive: true,
    },
  ]

  await db.insert(schema.makroEkonomi).values(rows)
  console.log(`Seeded ${rows.length} rows into makro_ekonomi`)
}

async function main() {
  config({ path: ".env.local" })

  if (process.env.DB_SEED_ALLOWED !== "true") {
    throw new Error(
      "Refusing to seed: set DB_SEED_ALLOWED=true in .env.local (dev only)"
    )
  }

  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set (see .env.example)")

  const db = createDb(url)
  await seedMakroEkonomi(db)
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
