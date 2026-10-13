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
import { updateVideoSchema } from "@/lib/schemas/video.schema"
import {
  EMPTY_VIDEO_VALUES,
  VideoFormFields,
  apiDetailsToErrors,
  detectUrlProblem,
  toVideoPayload,
  zodIssuesToErrors,
  type VideoFormErrors,
  type VideoFormValues,
} from "@/components/forms/video/video-form-fields"

export interface VideoItem {
  id: number
  judul: string
  url: string
  urutan: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface EditVideoDialogProps {
  item: VideoItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh: () => Promise<void> | void
}

export function EditVideoDialog({
  item,
  open,
  onOpenChange,
  onRefresh,
}: EditVideoDialogProps) {
  const [values, setValues] =
    React.useState<VideoFormValues>(EMPTY_VIDEO_VALUES)
  const [errors, setErrors] = React.useState<VideoFormErrors>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (item && open) {
      setValues({
        judul: item.judul,
        url: item.url,
        urutan: String(item.urutan),
        isActive: item.isActive,
      })
      setErrors({})
    }
  }, [item, open])

  const isDirty = React.useMemo(() => {
    if (!item) return false
    const p = toVideoPayload(values)
    return (
      p.judul !== item.judul ||
      p.url !== item.url ||
      p.urutan !== item.urutan ||
      p.isActive !== item.isActive
    )
  }, [item, values])

  const handleChange = (patch: Partial<VideoFormValues>) => {
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

    const problem = detectUrlProblem(values.url)
    if (problem?.level === "error") {
      setErrors({ url: problem.message })
      return
    }

    const validation = updateVideoSchema.safeParse(toVideoPayload(values))
    if (!validation.success) {
      setErrors(zodIssuesToErrors(validation.error.issues))
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/video/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        setErrors(apiDetailsToErrors(json))
        throw new Error(json?.error?.message || "Gagal memperbarui video")
      }

      toast.success("Video berhasil diperbarui")
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
          <DialogTitle>Ubah video</DialogTitle>
          <DialogDescription>
            Perbarui judul, file video, urutan, atau status tayang di videotron.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <VideoFormFields
            idPrefix="edit-video"
            values={values}
            onChange={handleChange}
            errors={errors}
            disabled={isSubmitting}
            judulPlaceholder="Judul video"
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
