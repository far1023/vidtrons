import { z } from "zod"

export const REGION_LEVELS = ["nasional", "provinsi", "kabkota"] as const

const kodeSchema = z
  .string({
    error: (issue) =>
      issue.input === undefined
        ? "Kode wilayah wajib diisi"
        : "Kode wilayah harus berupa teks",
  })
  .trim()
  .min(1, "Kode wilayah tidak boleh kosong")
  .max(16, "Kode wilayah maksimal 16 karakter")
  .regex(
    /^[0-9A-Za-z.]+$/,
    "Kode wilayah hanya boleh berisi huruf, angka, dan titik (contoh: 14.72)"
  )

const namaSchema = z
  .string({
    error: (issue) =>
      issue.input === undefined
        ? "Nama wilayah wajib diisi"
        : "Nama wilayah harus berupa teks",
  })
  .trim()
  .min(1, "Nama wilayah tidak boleh kosong")
  .max(100, "Nama wilayah maksimal 100 karakter")

const levelSchema = z.enum(REGION_LEVELS, {
  error: () =>
    "Tingkat wilayah harus salah satu dari: nasional, provinsi, kabkota",
})

const parentIdSchema = z
  .number({ error: () => "Induk wilayah harus berupa angka ID" })
  .int("Induk wilayah harus berupa bilangan bulat")
  .positive("Induk wilayah harus berupa angka positif")
  .nullable()

const warnaSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Warna harus berformat hex #RRGGBB")

export const createRegionSchema = z.object({
  kode: kodeSchema,
  nama: namaSchema,
  level: levelSchema,
  parentId: parentIdSchema.optional().default(null),
  warna: warnaSchema.nullable().optional().default(null),
  isActive: z.boolean().optional().default(true),
})

export const updateRegionSchema = z.object({
  kode: kodeSchema.optional(),
  nama: namaSchema.optional(),
  level: levelSchema.optional(),
  parentId: parentIdSchema.optional(),
  warna: warnaSchema.nullable().optional(),
  isActive: z.boolean().optional(),
})

export const listRegionsQuerySchema = z.object({
  level: z
    .enum(REGION_LEVELS, {
      error: () => "Level harus salah satu dari: nasional, provinsi, kabkota",
    })
    .optional(),
  parentId: z.coerce
    .number({ error: () => "parentId harus berupa angka" })
    .int("parentId harus berupa bilangan bulat")
    .positive("parentId harus berupa angka positif")
    .optional(),
  q: z.string().trim().max(50, "Pencarian maksimal 50 karakter").optional(),
})

export type CreateRegionInput = z.infer<typeof createRegionSchema>
export type UpdateRegionInput = z.infer<typeof updateRegionSchema>
export type ListRegionsQuery = z.infer<typeof listRegionsQuerySchema>

