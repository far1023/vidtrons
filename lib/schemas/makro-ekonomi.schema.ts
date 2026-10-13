import { z } from "zod";

export const makroEkonomiSchema = z.object({
  judul: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Nama indikator wajib diisi" : "Nama indikator harus berupa teks",
    })
    .trim()
    .min(1, "Nama indikator tidak boleh kosong")
    .max(100, "Nama indikator maksimal 100 karakter"),
  nilai: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Nilai indikator wajib diisi" : "Nilai harus berupa teks",
    })
    .trim()
    .min(1, "Nilai indikator tidak boleh kosong")
    .max(50, "Nilai maksimal 50 karakter"),
  satuan: z
    .string()
    .trim()
    .max(20, "Satuan maksimal 20 karakter")
    .default("%"),
  tahun: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Tahun/periode wajib diisi" : "Tahun/periode harus berupa teks",
    })
    .trim()
    .min(1, "Tahun/periode tidak boleh kosong")
    .max(20, "Tahun/periode maksimal 20 karakter"),
  tren: z
    .enum(["naik_positif", "turun_positif", "turun_negatif", "naik_negatif", "tetap", "naik", "turun"], {
      error: () => "Tren harus salah satu dari: naik_positif, turun_positif, turun_negatif, naik_negatif, atau tetap",
    })
    .default("tetap"),
  urutan: z
    .number({
      error: () => "Urutan harus berupa bilangan bulat",
    })
    .int()
    .min(0, "Urutan minimal 0")
    .default(0),
  isActive: z.boolean().default(true),
});

export const createMakroEkonomiSchema = makroEkonomiSchema;
export const updateMakroEkonomiSchema = makroEkonomiSchema.partial();

export type CreateMakroEkonomiInput = z.infer<typeof createMakroEkonomiSchema>;
export type UpdateMakroEkonomiInput = z.infer<typeof updateMakroEkonomiSchema>;
