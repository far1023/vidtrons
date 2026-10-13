import { z } from "zod";

export const agendaIdSchema = z.coerce
  .number({
    error: (issue) =>
      issue.input === undefined ? "ID agenda wajib diisi" : "ID agenda harus berupa angka",
  })
  .int("ID agenda harus berupa bilangan bulat")
  .positive("ID agenda harus berupa angka positif");

export const createAgendaSchema = z.object({
  judul: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Judul agenda wajib diisi" : "Judul agenda harus berupa teks",
    })
    .trim()
    .min(1, "Judul agenda tidak boleh kosong")
    .max(500, "Judul agenda maksimal 500 karakter"),
  tanggal: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Tanggal wajib diisi" : "Tanggal harus berupa teks",
    })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  mulai: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Waktu mulai wajib diisi" : "Waktu mulai harus berupa teks",
    })
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Format waktu mulai harus HH:mm"),
  selesai: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Waktu selesai wajib diisi" : "Waktu selesai harus berupa teks",
    })
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Format waktu selesai harus HH:mm"),
  lokasi: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Lokasi wajib diisi" : "Lokasi harus berupa teks",
    })
    .trim()
    .min(1, "Lokasi tidak boleh kosong")
    .max(255, "Lokasi maksimal 255 karakter"),
  isActive: z.boolean().default(true).optional(),
});

export const updateAgendaSchema = z
  .object({
    judul: z
      .string()
      .trim()
      .min(1, "Judul agenda tidak boleh kosong")
      .max(500, "Judul agenda maksimal 500 karakter")
      .optional(),
    tanggal: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
      .optional(),
    mulai: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Format waktu mulai harus HH:mm")
      .optional(),
    selesai: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Format waktu selesai harus HH:mm")
      .optional(),
    lokasi: z
      .string()
      .trim()
      .min(1, "Lokasi tidak boleh kosong")
      .max(255, "Lokasi maksimal 255 karakter")
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Setidaknya satu field harus diisi untuk memperbarui data agenda",
  });

export type CreateAgendaInput = z.infer<typeof createAgendaSchema>;
export type UpdateAgendaInput = z.infer<typeof updateAgendaSchema>;
