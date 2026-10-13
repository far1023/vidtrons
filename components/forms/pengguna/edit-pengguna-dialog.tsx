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
import { updateUserSchema } from "@/lib/schemas/user.schema"
import type { UserItem } from "@/types/user"
import {
  EMPTY_PENGGUNA_VALUES,
  PenggunaFormFields,
  apiFieldsToErrors,
  zodIssuesToErrors,
  type PenggunaFormErrors,
  type PenggunaFormValues,
} from "@/components/forms/pengguna/pengguna-form-fields"

interface EditPenggunaDialogProps {
  item: UserItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh: () => Promise<void> | void
}

export function EditPenggunaDialog({
  item,
  open,
  onOpenChange,
  onRefresh,
}: EditPenggunaDialogProps) {
  const [values, setValues] =
    React.useState<PenggunaFormValues>(EMPTY_PENGGUNA_VALUES)
  const [errors, setErrors] = React.useState<PenggunaFormErrors>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (item && open) {
      setValues({ email: item.email, password: "" })
      setErrors({})
    }
  }, [item, open])

  // Only send what actually changed; an empty password keeps the current one.
  const payload = React.useMemo(() => {
    if (!item) return {}
    const email = values.email.trim().toLowerCase()
    return {
      ...(email !== item.email ? { email: values.email } : {}),
      ...(values.password ? { password: values.password } : {}),
    }
  }, [item, values])

  const isDirty = Object.keys(payload).length > 0

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
    if (!item || isSubmitting || !isDirty) return
    setErrors({})

    const validation = updateUserSchema.safeParse(payload)
    if (!validation.success) {
      setErrors(zodIssuesToErrors(validation.error.issues))
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/pengguna/${item.id}`, {
        method: "PATCH",
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
        throw new Error(json?.error?.message || "Gagal memperbarui pengguna")
      }

      toast.success("Pengguna berhasil diperbarui")
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
          <DialogTitle>Ubah pengguna</DialogTitle>
          <DialogDescription>
            Perbarui email atau ganti password akun ini.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <PenggunaFormFields
            idPrefix="edit-pengguna"
            mode="edit"
            values={values}
            onChange={handleChange}
            errors={errors}
            disabled={isSubmitting}
          />

          <DialogFooter className="items-center gap-2 border-t pt-4 sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {isDirty
                ? "Ada perubahan yang belum disimpan."
                : "Belum ada perubahan."}
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={!isDirty || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan perubahan"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
