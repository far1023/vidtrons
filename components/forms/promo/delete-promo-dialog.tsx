"use client"

import * as React from "react"
import { toast } from "sonner"
import { ImageOff, Loader2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import type { PromoItem } from "./edit-promo-dialog"

interface DeletePromoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: PromoItem | null
  onRefresh: () => Promise<void> | void
}

function Thumbnail({ url }: { url: string }) {
  const [failed, setFailed] = React.useState(false)

  return (
    <div className="flex aspect-video w-28 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
      {failed ? (
        <ImageOff className="size-5 text-muted-foreground" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}

export function DeletePromoDialog({
  open,
  onOpenChange,
  item,
  onRefresh,
}: DeletePromoDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleOpenChange = (next: boolean) => {
    if (isDeleting && !next) return
    onOpenChange(next)
  }

  const handleDelete = async () => {
    if (!item || isDeleting) return
    setIsDeleting(true)

    try {
      const res = await fetch(`/api/admin/promo/${item.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error?.message || "Gagal menghapus promo")
      }

      toast.success("Promo berhasil dihapus")
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
          <AlertDialogTitle>Hapus promo ini?</AlertDialogTitle>
          <AlertDialogDescription>
            Promo akan dihapus permanen dari videotron dan tidak bisa
            dikembalikan.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
          <Thumbnail key={item.gambarUrl} url={item.gambarUrl} />
          <div className="min-w-0 space-y-0.5">
            <p className="line-clamp-2 text-sm font-medium">{item.judul}</p>
            <p className="text-xs text-muted-foreground">
              Urutan {item.urutan} · {item.isActive ? "Aktif" : "Nonaktif"}
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
              "Ya, hapus promo"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
