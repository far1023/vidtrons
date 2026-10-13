"use client"

import * as React from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { createUserSchema } from "@/lib/schemas/user.schema"
import {
  EMPTY_PENGGUNA_VALUES,
  PenggunaFormFields,
  apiFieldsToErrors,
  zodIssuesToErrors,
  type PenggunaFormErrors,
  type PenggunaFormValues,
} from "@/components/forms/pengguna/pengguna-form-fields"

interface AddPenggunaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh: () => Promise<void> | void
}

export function AddPenggunaDialog({
  open,
  onOpenChange,
  onRefresh,
}: AddPenggunaDialogProps) {
  const [values, setValues] =
    React.useState<PenggunaFormValues>(EMPTY_PENGGUNA_VALUES)
  const [errors, setErrors] = React.useState<PenggunaFormErrors>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setValues(EMPTY_PENGGUNA_VALUES)
      setErrors({})
    }
  }, [open])

  const handleChange = (patch: Partial<PenggunaFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }))
    setErrors((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(patch)) delete next[key]
      return next
    })
  }

  const handleOpenChange = (next: boolean) => {
    if (isSubmitting && !next) return
    onOpenChange(next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setErrors({})

    const validation = createUserSchema.safeParse(values)
    if (!validation.success) {
      setErrors(zodIssuesToErrors(validation.error.issues))
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/admin/pengguna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        setErrors(
          res.status === 409
            ? { email: json?.error?.message ?? "Email sudah digunakan" }
            : apiFieldsToErrors(json)
        )
        throw new Error(json?.error?.message || "Gagal menambahkan pengguna")
      }

      toast.success("Pengguna berhasil ditambahkan")
      onOpenChange(false)
      await onRefresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah pengguna</DialogTitle>
          <DialogDescription>
            Buat akun baru untuk masuk ke panel admin Layar Lobby.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <PenggunaFormFields
            idPrefix="add-pengguna"
            mode="add"
            values={values}
            onChange={handleChange}
            errors={errors}
            disabled={isSubmitting}
          />

          <DialogFooter className="gap-2 border-t pt-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan pengguna"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
