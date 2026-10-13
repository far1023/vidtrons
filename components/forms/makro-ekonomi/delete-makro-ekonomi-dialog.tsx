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
import type { MakroEkonomiItem } from "./edit-makro-ekonomi-dialog"

interface DeleteMakroEkonomiDialogProps {
  item: MakroEkonomiItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh: () => Promise<void> | void
}

export function DeleteMakroEkonomiDialog({
  item,
  open,
  onOpenChange,
  onRefresh,
}: DeleteMakroEkonomiDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleDelete = async () => {
    if (!item) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/makro-ekonomi/${item.id}`, {
        method: "DELETE",
      })

      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => null)
        toast.error(data?.error?.message || "Gagal menghapus indikator makro ekonomi")
        return
      }

      toast.warning("Indikator makro ekonomi berhasil dihapus")
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
          <AlertDialogTitle>Hapus Indikator Makro Ekonomi</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <span>
              Apakah Anda yakin ingin menghapus indikator makro ekonomi ini? Tindakan ini tidak dapat dibatalkan.
            </span>
            {item && (
              <span className="block rounded-md bg-muted p-3 text-xs text-foreground border">
                <strong>{item.judul}</strong>: {item.nilai} {item.satuan} ({item.tahun})
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
