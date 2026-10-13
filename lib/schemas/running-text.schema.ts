import { z } from "zod";

export const runningTextIdSchema = z.coerce
  .number({
    error: (issue) => (issue.input === undefined ? "ID wajib diisi" : "ID harus berupa angka"),
  })
  .int("ID harus berupa bilangan bulat")
  .positive("ID harus berupa angka positif");

export const createRunningTextSchema = z.object({
  isi: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Isi running text wajib diisi"
          : "Isi running text harus berupa teks",
    })
    .trim()
    .min(1, "Isi running text tidak boleh kosong")
    .max(500, "Isi running text maksimal 500 karakter"),
  isActive: z.boolean().default(true).optional(),
});

export const updateRunningTextSchema = z
  .object({
    isi: z
      .string()
      .trim()
      .min(1, "Isi running text tidak boleh kosong")
      .max(500, "Isi running text maksimal 500 karakter")
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Setidaknya satu field harus diisi untuk memperbarui data",
  });

export type CreateRunningTextInput = z.infer<typeof createRunningTextSchema>;
export type UpdateRunningTextInput = z.infer<typeof updateRunningTextSchema>;
