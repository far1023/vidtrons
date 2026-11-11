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
import type { RegionAdminItem } from "./edit-region-dialog"

interface DeleteRegionDialogProps {
  item: RegionAdminItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh: () => Promise<void> | void
}

export function DeleteRegionDialog({
  item,
  open,
  onOpenChange,
  onRefresh,
}: DeleteRegionDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleDelete = async () => {
    if (!item) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/regions/${item.id}`, {
        method: "DELETE",
      })

      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => null)
        toast.error(data?.error?.message || "Gagal menghapus wilayah")
        return
      }

      toast.warning(`Wilayah ${item.nama} berhasil dihapus`)
      onOpenChange(false)
      await onRefresh()
    } catch {
      toast.error("Terjadi kesalahan jaringan saat menghapus wilayah")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[480px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Wilayah</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <span>
              Apakah Anda yakin ingin menghapus wilayah ini? Wilayah yang masih
              memiliki data indikator makro ekonomi atau sub-wilayah tidak dapat
              dihapus.
            </span>
            {item && (
              <span className="block rounded-md border bg-muted p-3 text-xs text-foreground">
                <strong>{item.nama}</strong> ({item.kode})
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
              "Ya, Hapus Wilayah"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
