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
import { createVideoSchema } from "@/lib/schemas/video.schema"
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

interface AddVideoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh: () => Promise<void> | void
}

export function AddVideoDialog({
  open,
  onOpenChange,
  onRefresh,
}: AddVideoDialogProps) {
  const [values, setValues] =
    React.useState<VideoFormValues>(EMPTY_VIDEO_VALUES)
  const [errors, setErrors] = React.useState<VideoFormErrors>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setValues(EMPTY_VIDEO_VALUES)
      setErrors({})
    }
  }, [open])

  const handleChange = (patch: Partial<VideoFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }))
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

    const problem = detectUrlProblem(values.url)
    if (problem?.level === "error") {
      setErrors({ url: problem.message })
      return
    }

    const validation = createVideoSchema.safeParse(toVideoPayload(values))
    if (!validation.success) {
      setErrors(zodIssuesToErrors(validation.error.issues))
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/admin/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      })
      const json = await res.json().catch(() => null)

      if (!res.ok) {
        setErrors(apiDetailsToErrors(json))
        throw new Error(json?.error?.message || "Gagal menambahkan video")
      }

      toast.success("Video berhasil ditambahkan ke daftar putar")
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
          <DialogTitle>Tambah video</DialogTitle>
          <DialogDescription>
            Tambahkan video profil atau informasi untuk diputar di panel video
            videotron.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <VideoFormFields
            idPrefix="add-video"
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
                "Simpan video"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
