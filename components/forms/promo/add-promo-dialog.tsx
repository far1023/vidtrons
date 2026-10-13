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
import { createPromoSchema } from "@/lib/schemas/promo.schema"
import {
  EMPTY_PROMO_VALUES,
  PromoFormFields,
  apiDetailsToErrors,
  toPromoPayload,
  zodIssuesToErrors,
  type PromoFormErrors,
  type PromoFormValues,
} from "@/components/forms/promo/promo-form-fields"

interface AddPromoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh: () => Promise<void> | void
}

export function AddPromoDialog({
  open,
  onOpenChange,
  onRefresh,
}: AddPromoDialogProps) {
  const [values, setValues] =
    React.useState<PromoFormValues>(EMPTY_PROMO_VALUES)
  const [errors, setErrors] = React.useState<PromoFormErrors>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setValues(EMPTY_PROMO_VALUES)
      setErrors({})
    }
  }, [open])

  const handleChange = (patch: Partial<PromoFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }))
    // Hapus pesan error pada field yang sedang diubah
    setErrors((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(patch)) delete next[key]
      return next
    })
  }

  // Cegah dialog tertutup (klik luar / Esc) saat data sedang dikirim
  const handleOpenChange = (next: boolean) => {
    if (isSubmitting && !next) return
    onOpenChange(next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setErrors({})

    const validation = createPromoSchema.safeParse(toPromoPayload(values))
    if (!validation.success) {
      setErrors(zodIssuesToErrors(validation.error.issues))
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        setErrors(apiDetailsToErrors(json))
        throw new Error(json?.error?.message || "Gagal menambahkan promo")
      }

      toast.success("Promo berhasil ditambahkan")
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
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Tambah promo</DialogTitle>
          <DialogDescription>
            Tambahkan gambar promosi atau pengumuman untuk ditampilkan di
            videotron.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <PromoFormFields
            idPrefix="add"
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
                "Simpan promo"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
