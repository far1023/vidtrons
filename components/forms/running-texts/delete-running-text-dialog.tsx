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
import type { RunningTextItem } from "./edit-running-text-dialog"

interface DeleteRunningTextDialogProps {
  item: RunningTextItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh: () => Promise<void> | void
}

export function DeleteRunningTextDialog({
  item,
  open,
  onOpenChange,
  onRefresh,
}: DeleteRunningTextDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleDelete = async () => {
    if (!item) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/running-text/${item.id}`, {
        method: "DELETE",
      })

      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => null)
        toast.error(data?.error?.message || "Gagal menghapus teks berjalan")
        return
      }

      toast.warning("Teks berjalan berhasil dihapus")
      onOpenChange(false)
      await onRefresh()
    } catch {
      toast.error("Terjadi kesalahan jaringan saat menghapus data")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[480px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Teks Berjalan</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <span>
              Apakah Anda yakin ingin menghapus teks berjalan ini? Tindakan ini tidak dapat dibatalkan.
            </span>
            {item && (
              <span className="block rounded-md bg-muted p-3 text-xs italic text-foreground border">
                &ldquo;{item.isi}&rdquo;
              </span>
            )}
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
