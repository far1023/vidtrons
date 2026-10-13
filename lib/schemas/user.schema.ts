import { z } from "zod";

/** bcrypt only uses the first 72 bytes, so longer passwords are rejected up front. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

const emailField = z
  .string({
    error: (issue) =>
      issue.input === undefined ? "Email wajib diisi" : "Email harus berupa teks",
  })
  .trim()
  .toLowerCase()
  .min(1, "Email tidak boleh kosong")
  .max(255, "Email maksimal 255 karakter")
  .pipe(z.email("Format email tidak valid"));

const passwordField = z
  .string({
    error: (issue) =>
      issue.input === undefined ? "Password wajib diisi" : "Password harus berupa teks",
  })
  .min(PASSWORD_MIN_LENGTH, `Password minimal ${PASSWORD_MIN_LENGTH} karakter`)
  .max(PASSWORD_MAX_LENGTH, `Password maksimal ${PASSWORD_MAX_LENGTH} karakter`);

export const createUserSchema = z.object({
  email: emailField,
  password: passwordField,
});

/** Both fields optional: leave `password` out to keep the current one. */
export const updateUserSchema = z.object({
  email: emailField.optional(),
  password: passwordField.optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
