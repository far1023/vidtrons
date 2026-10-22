"use client"

import * as React from "react"
import { toast } from "sonner"
import { Loader2, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface KategoriItem {
  id: number
  nama: string
  warna: string
}

const COLOR_PRESETS = [
  "#059669", // emerald
  "#2563eb", // blue
  "#7c3aed", // violet
  "#d97706", // amber
  "#dc2626", // red
  "#0891b2", // cyan
  "#4f46e5", // indigo
  "#475569", // slate
]

interface ManageKategoriDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  kategoriList: KategoriItem[]
  onRefreshKategori: () => Promise<void> | void
}

export function ManageKategoriDialog({
  open,
  onOpenChange,
  kategoriList,
  onRefreshKategori,
}: ManageKategoriDialogProps) {
  const [nama, setNama] = React.useState("")
  const [warna, setWarna] = React.useState(COLOR_PRESETS[0])
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<number | null>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nama.trim()) {
      toast.error("Nama kategori tidak boleh kosong")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/admin/kategori", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: nama.trim(), warna }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error?.message || "Gagal menambahkan kategori")
      }

      toast.success("Kategori berhasil ditambahkan")
      setNama("")
      await onRefreshKategori()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number, namaKat: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/kategori/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        throw new Error("Gagal menghapus kategori")
      }

      toast.success(`Kategori "${namaKat}" berhasil dihapus`)
      await onRefreshKategori()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Kelola Kategori Pengumuman</DialogTitle>
          <DialogDescription>
            Tambah atau hapus label kategori untuk mengelompokkan pengumuman.
          </DialogDescription>
        </DialogHeader>

        {/* Form Tambah */}
        <form onSubmit={handleAdd} className="space-y-3 rounded-lg border p-3 bg-muted/20">
          <div className="space-y-1.5">
            <Label htmlFor="kategori-nama" className="text-xs font-medium">
              Nama Kategori Baru
            </Label>
            <Input
              id="kategori-nama"
              placeholder="Contoh: Info Penting, Pelayanan, Libur"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="h-8 text-sm"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Pilih Warna Badge</Label>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setWarna(c)}
                  className={`size-6 rounded-full border-2 transition-transform ${
                    warna === c ? "scale-110 border-foreground shadow" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
              <input
                type="color"
                value={warna}
                onChange={(e) => setWarna(e.target.value)}
                className="size-6 cursor-pointer rounded border p-0"
                title="Warna custom"
              />
            </div>
          </div>

          <Button
            type="submit"
            size="sm"
            className="w-full"
            disabled={!nama.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Tambah Kategori"
            )}
          </Button>
        </form>

        {/* List Kategori */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Daftar Kategori ({kategoriList.length})
          </Label>
          <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
            {kategoriList.length === 0 ? (
              <p className="text-center py-4 text-xs text-muted-foreground">
                Belum ada kategori. Silakan tambahkan kategori baru di atas.
              </p>
            ) : (
              kategoriList.map((kat) => (
                <div
                  key={kat.id}
                  className="flex items-center justify-between rounded-md border px-2.5 py-1.5 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: kat.warna }}
                    />
                    <span className="font-medium">{kat.nama}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDelete(kat.id, kat.nama)}
                    disabled={deletingId === kat.id}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    {deletingId === kat.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
