"use client"

import * as React from "react"
import { Eye, EyeOff, KeyRound, Wand2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/lib/schemas/user.schema"

export interface PenggunaFormValues {
  email: string
  password: string
}

export const EMPTY_PENGGUNA_VALUES: PenggunaFormValues = {
  email: "",
  password: "",
}

export type PenggunaFormErrors = Record<string, string>

export function zodIssuesToErrors(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>
): PenggunaFormErrors {
  const out: PenggunaFormErrors = {}
  for (const issue of issues) {
    const key = issue.path[0] !== undefined ? String(issue.path[0]) : ""
    if (key && !out[key]) out[key] = issue.message
  }
  return out
}

/** Maps the API error body ({ error: { fields: { field: [messages] } } }) to form errors. */
export function apiFieldsToErrors(json: unknown): PenggunaFormErrors {
  const out: PenggunaFormErrors = {}
  const fields = (json as { error?: { fields?: Record<string, string[]> } } | null)
    ?.error?.fields
  if (fields) {
    for (const [key, messages] of Object.entries(fields)) {
      if (messages?.[0]) out[key] = messages[0]
    }
  }
  return out
}

/** Random password from an unambiguous alphabet (no 0/O, 1/l/I). */
function generatePassword(length = 12): string {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%"
  const bytes = new Uint32Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (n) => alphabet[n % alphabet.length]).join("")
}

interface PenggunaFormFieldsProps {
  idPrefix: string
  mode: "add" | "edit"
  values: PenggunaFormValues
  onChange: (patch: Partial<PenggunaFormValues>) => void
  errors: PenggunaFormErrors
  disabled?: boolean
}

export function PenggunaFormFields({
  idPrefix,
  mode,
  values,
  onChange,
  errors,
  disabled,
}: PenggunaFormFieldsProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  const id = (name: string) => `${idPrefix}-${name}`
  const isEdit = mode === "edit"

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor={id("email")}>
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id={id("email")}
          type="email"
          inputMode="email"
          placeholder="nama@bappeda.go.id"
          value={values.email}
          onChange={(e) => onChange({ email: e.target.value })}
          disabled={disabled}
          autoFocus
          autoComplete="off"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? id("email-error") : undefined}
        />
        {errors.email ? (
          <p id={id("email-error")} className="text-xs text-destructive">
            {errors.email}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Dipakai untuk masuk ke panel admin.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={id("password")}>
            {isEdit ? "Password baru" : "Password"}{" "}
            {!isEdit && <span className="text-destructive">*</span>}
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs"
            onClick={() => {
              onChange({ password: generatePassword() })
              setShowPassword(true)
            }}
            disabled={disabled}
          >
            <Wand2 className="size-3.5" />
            Buat otomatis
          </Button>
        </div>

        <div className="relative">
          <KeyRound className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            id={id("password")}
            type={showPassword ? "text" : "password"}
            placeholder={
              isEdit ? "Kosongkan jika tidak diubah" : "Minimal 8 karakter"
            }
            value={values.password}
            onChange={(e) => onChange({ password: e.target.value })}
            disabled={disabled}
            maxLength={PASSWORD_MAX_LENGTH}
            autoComplete="new-password"
            className="pr-10 pl-9"
            aria-invalid={!!errors.password}
            aria-describedby={id("password-hint")}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-0.5 right-0.5 size-8"
            onClick={() => setShowPassword((v) => !v)}
            disabled={disabled}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </Button>
        </div>

        <div id={id("password-hint")} className="text-xs">
          {errors.password ? (
            <p className="text-destructive">{errors.password}</p>
          ) : (
            <p className="text-muted-foreground">
              {isEdit
                ? `Isi hanya untuk mengganti password (minimal ${PASSWORD_MIN_LENGTH} karakter).`
                : `Minimal ${PASSWORD_MIN_LENGTH} karakter. Simpan password ini, tidak dapat dilihat kembali.`}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
