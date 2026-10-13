import { z } from "zod";

export const promoIdSchema = z.coerce
  .number({
    error: (issue) =>
      issue.input === undefined ? "ID promo wajib diisi" : "ID promo harus berupa angka",
  })
  .int("ID promo harus berupa bilangan bulat")
  .positive("ID promo harus berupa angka positif");

export const createPromoSchema = z.object({
  judul: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Judul promo wajib diisi" : "Judul promo harus berupa teks",
    })
    .trim()
    .min(1, "Judul promo tidak boleh kosong")
    .max(255, "Judul promo maksimal 255 karakter"),
  gambarUrl: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "URL gambar wajib diisi" : "URL gambar harus berupa teks",
    })
    .trim()
    .url("Format URL gambar tidak valid")
    .startsWith("https://", "URL gambar harus menggunakan protokol HTTPS (https://)"),
  urutan: z.coerce
    .number()
    .int("Urutan harus berupa bilangan bulat")
    .min(0, "Urutan minimal 0")
    .default(0)
    .optional(),
  isActive: z.boolean().default(true).optional(),
});

export const updatePromoSchema = z
  .object({
    judul: z
      .string()
      .trim()
      .min(1, "Judul promo tidak boleh kosong")
      .max(255, "Judul promo maksimal 255 karakter")
      .optional(),
    gambarUrl: z
      .string()
      .trim()
      .url("Format URL gambar tidak valid")
      .startsWith("https://", "URL gambar harus menggunakan protokol HTTPS (https://)")
      .optional(),
    urutan: z.coerce
      .number()
      .int("Urutan harus berupa bilangan bulat")
      .min(0, "Urutan minimal 0")
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Setidaknya satu field harus diisi untuk memperbarui data promo",
  });

export type CreatePromoInput = z.infer<typeof createPromoSchema>;
export type UpdatePromoInput = z.infer<typeof updatePromoSchema>;
