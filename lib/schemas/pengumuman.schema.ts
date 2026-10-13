import { z } from "zod";

export const pengumumanIdSchema = z.coerce
  .number({
    error: (issue) =>
      issue.input === undefined ? "ID pengumuman wajib diisi" : "ID pengumuman harus berupa angka",
  })
  .int("ID pengumuman harus berupa bilangan bulat")
  .positive("ID pengumuman harus berupa angka positif");

export const createPengumumanSchema = z.object({
  judul: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Judul pengumuman wajib diisi"
          : "Judul pengumuman harus berupa teks",
    })
    .trim()
    .min(1, "Judul pengumuman tidak boleh kosong")
    .max(500, "Judul pengumuman maksimal 500 karakter"),
  tanggal: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Tanggal wajib diisi" : "Tanggal harus berupa teks",
    })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  kategoriId: z
    .coerce
    .number()
    .int("ID kategori harus berupa bilangan bulat")
    .positive("ID kategori harus berupa angka positif")
    .nullable()
    .optional(),
  isActive: z.boolean().default(true).optional(),
});

export const updatePengumumanSchema = z
  .object({
    judul: z
      .string()
      .trim()
      .min(1, "Judul pengumuman tidak boleh kosong")
      .max(500, "Judul pengumuman maksimal 500 karakter")
      .optional(),
    tanggal: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
      .optional(),
    kategoriId: z
      .coerce
      .number()
      .int("ID kategori harus berupa bilangan bulat")
      .positive("ID kategori harus berupa angka positif")
      .nullable()
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Setidaknya satu field harus diisi untuk memperbarui data pengumuman",
  });

export type CreatePengumumanInput = z.infer<typeof createPengumumanSchema>;
export type UpdatePengumumanInput = z.infer<typeof updatePengumumanSchema>;
