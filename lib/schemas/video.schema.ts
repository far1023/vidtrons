import { z } from "zod";

export const videoIdSchema = z.coerce
  .number({
    error: (issue) =>
      issue.input === undefined ? "ID video wajib diisi" : "ID video harus berupa angka",
  })
  .int("ID video harus berupa bilangan bulat")
  .positive("ID video harus berupa angka positif");

export const createVideoSchema = z.object({
  judul: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Judul video wajib diisi" : "Judul video harus berupa teks",
    })
    .trim()
    .min(1, "Judul video tidak boleh kosong")
    .max(255, "Judul video maksimal 255 karakter"),
  url: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "URL video wajib diisi" : "URL video harus berupa teks",
    })
    .trim()
    .url("Format URL video tidak valid")
    .startsWith("https://", "URL video harus menggunakan protokol HTTPS (https://)"),
  urutan: z.coerce
    .number()
    .int("Urutan harus berupa bilangan bulat")
    .min(0, "Urutan minimal 0")
    .default(0)
    .optional(),
  isActive: z.boolean().default(true).optional(),
});

export const updateVideoSchema = z
  .object({
    judul: z
      .string()
      .trim()
      .min(1, "Judul video tidak boleh kosong")
      .max(255, "Judul video maksimal 255 karakter")
      .optional(),
    url: z
      .string()
      .trim()
      .url("Format URL video tidak valid")
      .startsWith("https://", "URL video harus menggunakan protokol HTTPS (https://)")
      .optional(),
    urutan: z.coerce
      .number()
      .int("Urutan harus berupa bilangan bulat")
      .min(0, "Urutan minimal 0")
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Setidaknya satu field harus diisi untuk memperbarui data video",
  });

export type CreateVideoInput = z.infer<typeof createVideoSchema>;
export type UpdateVideoInput = z.infer<typeof updateVideoSchema>;
