import { z } from "zod"

const regionIdSchema = z
  .number({
    error: (issue) =>
      issue.input === undefined
        ? "Wilayah wajib dipilih"
        : "Wilayah harus berupa angka ID",
  })
  .int("Wilayah harus berupa bilangan bulat")
  .positive("Wilayah harus berupa angka positif")

export const makroEkonomiSchema = z.object({
  regionId: regionIdSchema,
  judul: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Nama indikator wajib diisi"
          : "Nama indikator harus berupa teks",
    })
    .trim()
    .min(1, "Nama indikator tidak boleh kosong")
    .max(100, "Nama indikator maksimal 100 karakter"),
  nilai: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Nilai indikator wajib diisi"
          : "Nilai harus berupa teks",
    })
    .trim()
    .min(1, "Nilai indikator tidak boleh kosong")
    .max(50, "Nilai maksimal 50 karakter"),
  satuan: z.string().trim().max(20, "Satuan maksimal 20 karakter").default("%"),
  tahun: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Tahun/periode wajib diisi"
          : "Tahun/periode harus berupa teks",
    })
    .trim()
    .min(1, "Tahun/periode tidak boleh kosong")
    .max(20, "Tahun/periode maksimal 20 karakter"),
  tren: z
    .enum(
      [
        "naik_positif",
        "turun_positif",
        "turun_negatif",
        "naik_negatif",
        "tetap",
        "naik",
        "turun",
      ],
      {
        error: () =>
          "Tren harus salah satu dari: naik_positif, turun_positif, turun_negatif, naik_negatif, atau tetap",
      }
    )
    .default("tetap"),
  urutan: z
    .number({
      error: () => "Urutan harus berupa bilangan bulat",
    })
    .int()
    .min(0, "Urutan minimal 0")
    .default(0),
  isActive: z.boolean().default(true),
})

export const createMakroEkonomiSchema = makroEkonomiSchema
export const updateMakroEkonomiSchema = z.object({
  regionId: regionIdSchema.optional(),
  judul: z
    .string()
    .trim()
    .min(1, "Nama indikator tidak boleh kosong")
    .max(100, "Nama indikator maksimal 100 karakter")
    .optional(),
  nilai: z
    .string()
    .trim()
    .min(1, "Nilai indikator tidak boleh kosong")
    .max(50, "Nilai maksimal 50 karakter")
    .optional(),
  satuan: z.string().trim().max(20, "Satuan maksimal 20 karakter").optional(),
  tahun: z
    .string()
    .trim()
    .min(1, "Tahun/periode tidak boleh kosong")
    .max(20, "Tahun/periode maksimal 20 karakter")
    .optional(),
  tren: z
    .enum(
      [
        "naik_positif",
        "turun_positif",
        "turun_negatif",
        "naik_negatif",
        "tetap",
        "naik",
        "turun",
      ],
      {
        error: () =>
          "Tren harus salah satu dari: naik_positif, turun_positif, turun_negatif, naik_negatif, atau tetap",
      }
    )
    .optional(),
  urutan: z
    .number({
      error: () => "Urutan harus berupa bilangan bulat",
    })
    .int()
    .min(0, "Urutan minimal 0")
    .optional(),
  isActive: z.boolean().optional(),
})

export type CreateMakroEkonomiInput = z.infer<typeof createMakroEkonomiSchema>
export type UpdateMakroEkonomiInput = z.infer<typeof updateMakroEkonomiSchema>

export const MAX_MAKRO_REGIONS = 5

function parsePositiveIntCsv(
  raw: string,
  ctx: z.RefinementCtx,
  fieldName: string
): number[] {
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length === 0) {
    ctx.addIssue({
      code: "custom",
      message: `${fieldName} tidak boleh kosong`,
    })
    return z.NEVER
  }
  const seen = new Set<number>()
  const result: number[] = []
  for (const part of parts) {
    if (!/^\d+$/.test(part)) {
      ctx.addIssue({
        code: "custom",
        message: `${fieldName} harus berisi angka ID positif yang dipisahkan koma`,
      })
      return z.NEVER
    }
    const n = Number(part)
    if (!Number.isSafeInteger(n) || n <= 0) {
      ctx.addIssue({
        code: "custom",
        message: `${fieldName} harus berisi angka ID positif`,
      })
      return z.NEVER
    }
    if (!seen.has(n)) {
      seen.add(n)
      result.push(n)
    }
  }
  if (result.length > MAX_MAKRO_REGIONS) {
    ctx.addIssue({
      code: "custom",
      message: `Maksimal ${MAX_MAKRO_REGIONS} wilayah dapat dipilih sekaligus`,
    })
    return z.NEVER
  }
  return result
}

export const grafikMakroQuerySchema = z.object({
  regionIds: z
    .string()
    .trim()
    .transform((val, ctx) => parsePositiveIntCsv(val, ctx, "regionIds"))
    .optional(),
  tahun: z.coerce
    .number({ error: () => "Jumlah tahun harus berupa angka" })
    .int("Jumlah tahun harus berupa bilangan bulat")
    .min(1, "Jumlah tahun minimal 1")
    .max(20, "Jumlah tahun maksimal 20")
    .default(5),
})

export type GrafikMakroQuery = z.infer<typeof grafikMakroQuerySchema>
