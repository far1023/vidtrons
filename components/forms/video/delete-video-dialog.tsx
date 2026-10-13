"use client"

import * as React from "react"
import { toast } from "sonner"
import { Film, Loader2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import type { VideoItem } from "./edit-video-dialog"

interface DeleteVideoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: VideoItem | null
  onRefresh: () => Promise<void> | void
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

/** Cuplikan frame pertama (hanya metadata yang diunduh, bukan seluruh file). */
function Thumbnail({ url }: { url: string }) {
  const [failed, setFailed] = React.useState(false)
  const src = url.includes("#") ? url : `${url}#t=0.1`

  return (
    <div className="flex aspect-video w-28 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-black">
      {failed ? (
        <Film className="size-5 text-white/50" />
      ) : (
        <video
          src={src}
          preload="metadata"
          muted
          playsInline
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}

export function DeleteVideoDialog({
  open,
  onOpenChange,
  item,
  onRefresh,
}: DeleteVideoDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleOpenChange = (next: boolean) => {
    if (isDeleting && !next) return
    onOpenChange(next)
  }

  const handleDelete = async () => {
    if (!item || isDeleting) return
    setIsDeleting(true)

    try {
      const res = await fetch(`/api/admin/video/${item.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error?.message || "Gagal menghapus video")
      }

      toast.success("Video berhasil dihapus")
      onOpenChange(false)
      await onRefresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setIsDeleting(false)
    }
  }

  if (!item) return null

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus video ini?</AlertDialogTitle>
          <AlertDialogDescription>
            Video akan dihapus permanen dari daftar putar videotron dan tidak
            bisa dikembalikan. File aslinya di server hosting tidak ikut
            terhapus.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
          <Thumbnail key={item.url} url={item.url} />
          <div className="min-w-0 space-y-0.5">
            <p className="line-clamp-2 text-sm font-medium">{item.judul}</p>
            <p className="truncate text-xs text-muted-foreground">
              {hostOf(item.url)}
            </p>
            <p className="text-xs text-muted-foreground">
              Urutan {item.urutan}, {item.isActive ? "aktif" : "nonaktif"}
            </p>
          </div>
        </div>

        <AlertDialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              "Ya, hapus video"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
