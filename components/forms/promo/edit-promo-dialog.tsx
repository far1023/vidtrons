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
import { updatePromoSchema } from "@/lib/schemas/promo.schema"
import {
  EMPTY_PROMO_VALUES,
  PromoFormFields,
  apiDetailsToErrors,
  toPromoPayload,
  zodIssuesToErrors,
  type PromoFormErrors,
  type PromoFormValues,
} from "@/components/forms/promo/promo-form-fields"

export interface PromoItem {
  id: number
  judul: string
  gambarUrl: string
  urutan: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface EditPromoDialogProps {
  item: PromoItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh: () => Promise<void> | void
}

export function EditPromoDialog({
  item,
  open,
  onOpenChange,
  onRefresh,
}: EditPromoDialogProps) {
  const [values, setValues] =
    React.useState<PromoFormValues>(EMPTY_PROMO_VALUES)
  const [errors, setErrors] = React.useState<PromoFormErrors>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (item && open) {
      setValues({
        judul: item.judul,
        gambarUrl: item.gambarUrl,
        urutan: String(item.urutan),
        isActive: item.isActive,
      })
      setErrors({})
    }
  }, [item, open])

  const isDirty = React.useMemo(() => {
    if (!item) return false
    const p = toPromoPayload(values)
    return (
      p.judul !== item.judul ||
      p.gambarUrl !== item.gambarUrl ||
      p.urutan !== item.urutan ||
      p.isActive !== item.isActive
    )
  }, [item, values])

  const handleChange = (patch: Partial<PromoFormValues>) => {
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

    const validation = updatePromoSchema.safeParse(toPromoPayload(values))
    if (!validation.success) {
      setErrors(zodIssuesToErrors(validation.error.issues))
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/promo/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        setErrors(apiDetailsToErrors(json))
        throw new Error(json?.error?.message || "Gagal memperbarui promo")
      }

      toast.success("Promo berhasil diperbarui")
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
          <DialogTitle>Ubah promo</DialogTitle>
          <DialogDescription>
            Perbarui gambar, urutan, atau status tayang promo di videotron.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <PromoFormFields
            idPrefix="edit"
            values={values}
            onChange={handleChange}
            errors={errors}
            disabled={isSubmitting}
            judulPlaceholder="Judul promo"
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
