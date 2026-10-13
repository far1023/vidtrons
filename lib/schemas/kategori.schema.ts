import { z } from "zod";

export const kategoriIdSchema = z.coerce
  .number({
    error: (issue) =>
      issue.input === undefined ? "ID kategori wajib diisi" : "ID kategori harus berupa angka",
  })
  .int("ID kategori harus berupa bilangan bulat")
  .positive("ID kategori harus berupa angka positif");

export const createKategoriSchema = z.object({
  nama: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Nama kategori wajib diisi"
          : "Nama kategori harus berupa teks",
    })
    .trim()
    .min(1, "Nama kategori tidak boleh kosong")
    .max(100, "Nama kategori maksimal 100 karakter"),
  warna: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Warna kategori wajib diisi"
          : "Warna kategori harus berupa teks",
    })
    .trim()
    .min(1, "Warna kategori tidak boleh kosong")
    .max(32, "Warna kategori maksimal 32 karakter")
    .default("#059669"),
});

export const updateKategoriSchema = z
  .object({
    nama: z
      .string()
      .trim()
      .min(1, "Nama kategori tidak boleh kosong")
      .max(100, "Nama kategori maksimal 100 karakter")
      .optional(),
    warna: z
      .string()
      .trim()
      .min(1, "Warna kategori tidak boleh kosong")
      .max(32, "Warna kategori maksimal 32 karakter")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Setidaknya satu field harus diisi untuk memperbarui kategori",
  });

export type CreateKategoriInput = z.infer<typeof createKategoriSchema>;
export type UpdateKategoriInput = z.infer<typeof updateKategoriSchema>;
