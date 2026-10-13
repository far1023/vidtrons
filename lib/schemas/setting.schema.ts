import { z } from "zod";

const httpsUrlOptional = z
  .string()
  .trim()
  .transform((val) => (val === "" ? null : val))
  .nullable()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      try {
        const u = new URL(val);
        return u.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "URL logo harus berupa URL valid dengan protokol HTTPS (https://)" }
  );

export const updateSettingsSchema = z.object({
  namaInstansi: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Nama instansi wajib diisi" : "Nama instansi harus berupa teks",
    })
    .trim()
    .min(1, "Nama instansi tidak boleh kosong")
    .max(255, "Nama instansi maksimal 255 karakter"),
  slogan: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Slogan wajib diisi" : "Slogan harus berupa teks",
    })
    .trim()
    .min(1, "Slogan tidak boleh kosong")
    .max(255, "Slogan maksimal 255 karakter"),
  logoUrl: httpsUrlOptional,
  makroQrUrl: httpsUrlOptional,
  makroQrLabel: z.string().trim().max(100, "Keterangan QR maksimal 100 karakter").nullable().optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
