"use client"

import * as React from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import type { PengumumanItem } from "./edit-pengumuman-dialog"

interface DeletePengumumanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: PengumumanItem | null
  onRefresh: () => Promise<void> | void
}

export function DeletePengumumanDialog({
  open,
  onOpenChange,
  item,
  onRefresh,
}: DeletePengumumanDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleDelete = async () => {
    if (!item) return
    setIsDeleting(true)

    try {
      const res = await fetch(`/api/admin/pengumuman/${item.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.error?.message || "Gagal menghapus pengumuman")
      }

      toast.warning("Pengumuman telah berhasil dihapus")
      onOpenChange(false)
      await onRefresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan"
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!item) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Pengumuman Ini?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span>Tindakan ini tidak dapat dibatalkan. Pengumuman berikut akan dihapus secara permanen:</span>
            <span className="block rounded border bg-muted/50 p-2.5 text-xs text-foreground italic line-clamp-3">
              &ldquo;{item.judul}&rdquo;
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
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
              "Ya, Hapus Data"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
