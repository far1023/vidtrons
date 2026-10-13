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
import type { UserItem } from "@/types/user"

interface DeletePenggunaDialogProps {
  item: UserItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh: () => Promise<void> | void
}

export function DeletePenggunaDialog({
  item,
  open,
  onOpenChange,
  onRefresh,
}: DeletePenggunaDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleOpenChange = (next: boolean) => {
    if (isDeleting && !next) return
    onOpenChange(next)
  }

  const handleDelete = async () => {
    if (!item || isDeleting) return
    setIsDeleting(true)

    try {
      const res = await fetch(`/api/admin/pengguna/${item.id}`, {
        method: "DELETE",
      })

      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error?.message || "Gagal menghapus pengguna")
      }

      toast.success("Pengguna berhasil dihapus")
      onOpenChange(false)
      await onRefresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-[480px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus pengguna ini?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <span>
              Akun akan dihapus permanen dan tidak bisa lagi masuk ke panel
              admin. Tindakan ini tidak dapat dibatalkan.
            </span>
            {item && (
              <span className="block rounded-md border bg-muted p-3 text-xs font-medium text-foreground">
                {item.email}
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
              "Ya, hapus pengguna"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
