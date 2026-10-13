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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { updateRunningTextSchema } from "@/lib/schemas/running-text.schema"

export interface RunningTextItem {
  id: number
  isi: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface EditRunningTextDialogProps {
  item: RunningTextItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh: () => Promise<void> | void
}

export function EditRunningTextDialog({
  item,
  open,
  onOpenChange,
  onRefresh,
}: EditRunningTextDialogProps) {
  const [isi, setIsi] = React.useState("")
  const [isActive, setIsActive] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Populate data when item changes or modal opens
  React.useEffect(() => {
    if (item && open) {
      setIsi(item.isi)
      setIsActive(item.isActive)
      setErrors({})
    }
  }, [item, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return
    setErrors({})

    // Client-side validation using shared schema
    const validation = updateRunningTextSchema.safeParse({ isi, isActive })
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of validation.error.issues) {
        const path = issue.path[0]?.toString() || "isi"
        fieldErrors[path] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/running-text/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isi: validation.data.isi,
          isActive: validation.data.isActive,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data?.error?.fields) {
          const serverFields: Record<string, string> = {}
          for (const [key, msgs] of Object.entries(data.error.fields)) {
            serverFields[key] = (msgs as string[])[0]
          }
          setErrors(serverFields)
        }
        toast.error(data?.error?.message || "Gagal memperbarui teks berjalan")
        return
      }

      toast.success("Teks berjalan berhasil diperbarui")
      onOpenChange(false)
      await onRefresh()
    } catch {
      toast.error("Terjadi kesalahan jaringan saat memperbarui data")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = isi.trim().length > 0 && isi.trim().length <= 500

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Ubah Teks Berjalan</DialogTitle>
            <DialogDescription>
              Perbarui teks informasi atau status penayangan di videotron.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-isi" className="text-sm font-medium">
                Isi Informasi <span className="text-destructive">*</span>
              </Label>
              <span className="text-xs text-muted-foreground">
                {isi.length}/500 karakter
              </span>
            </div>
            <Textarea
              id="edit-isi"
              name="isi"
              value={isi}
              onChange={(e) => setIsi(e.target.value)}
              placeholder="Isi running text..."
              rows={4}
              maxLength={500}
              aria-invalid={!!errors.isi}
              className={errors.isi ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {errors.isi && (
              <p className="text-xs text-destructive">{errors.isi}</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="edit-isActive" className="text-sm font-medium cursor-pointer">
                Tampilkan di Videotron
              </Label>
              <p className="text-xs text-muted-foreground">
                Aktifkan agar teks ini diputar di layar lobby.
              </p>
            </div>
            <Switch
              id="edit-isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
