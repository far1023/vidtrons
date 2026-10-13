"use client"

import * as React from "react"
import { toast } from "sonner"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { createPengumumanSchema } from "@/lib/schemas/pengumuman.schema"
import type { KategoriItem } from "./manage-kategori-dialog"

interface AddPengumumanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  kategoriList: KategoriItem[]
  onRefresh: () => Promise<void> | void
}

function getTodayString(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function AddPengumumanDialog({
  open,
  onOpenChange,
  kategoriList,
  onRefresh,
}: AddPengumumanDialogProps) {
  const [judul, setJudul] = React.useState("")
  const [tanggal, setTanggal] = React.useState(getTodayString())
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date())
  const [kategoriId, setKategoriId] = React.useState<string>("none")
  const [isActive, setIsActive] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setJudul("")
      const todayStr = getTodayString()
      setTanggal(todayStr)
      setSelectedDate(new Date())
      setKategoriId("none")
      setIsActive(true)
      setErrors({})
    }
  }, [open])

  const handleDateSelect = (d: Date | undefined) => {
    setSelectedDate(d)
    if (d) {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, "0")
      const day = String(d.getDate()).padStart(2, "0")
      setTanggal(`${year}-${month}-${day}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const parsedKategoriId =
      kategoriId === "none" || !kategoriId ? null : Number(kategoriId)

    // Client-side validation using shared schema
    const validation = createPengumumanSchema.safeParse({
      judul,
      tanggal,
      kategoriId: parsedKategoriId,
      isActive,
    })

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of validation.error.issues) {
        const path = issue.path[0]?.toString() || "judul"
        fieldErrors[path] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/admin/pengumuman", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul: validation.data.judul,
          tanggal: validation.data.tanggal,
          kategoriId: validation.data.kategoriId,
          isActive: validation.data.isActive,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data?.error?.fields) {
          const serverFields: Record<string, string> = {}
          for (const [key, msgs] of Object.entries(data.error.fields)) {
            serverFields[key] = (msgs as string[])[0]
          }
          setErrors(serverFields)
        } else {
          toast.error(data?.error?.message || "Gagal menyimpan pengumuman")
        }
        return
      }

      toast.success("Pengumuman berhasil ditambahkan")
      onOpenChange(false)
      await onRefresh()
    } catch {
      toast.error("Terjadi kesalahan jaringan. Silakan coba lagi.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = judul.trim().length > 0 && tanggal.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah Pengumuman Baru</DialogTitle>
          <DialogDescription>
            Tuliskan informasi atau pengumuman yang akan ditampilkan pada layar lobby.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Judul Pengumuman */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="add-judul" className="text-sm font-medium">
                Judul Pengumuman <span className="text-destructive">*</span>
              </Label>
              <span
                className={`text-xs ${
                  judul.length > 500
                    ? "text-destructive font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {judul.length}/500
              </span>
            </div>
            <Textarea
              id="add-judul"
              placeholder="Contoh: Diberitahukan kepada seluruh pegawai..."
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              rows={4}
              maxLength={500}
              className={`resize-none ${errors.judul ? "border-destructive" : ""}`}
              disabled={isSubmitting}
            />
            {errors.judul && (
              <p className="text-xs text-destructive">{errors.judul}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Tanggal */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Tanggal Pengumuman <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      className={`h-9 w-full justify-start text-left font-normal ${
                        !selectedDate ? "text-muted-foreground" : ""
                      }`}
                      disabled={isSubmitting}
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {selectedDate
                        ? format(selectedDate, "d MMMM yyyy", { locale: idLocale })
                        : "Pilih tanggal"}
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                  />
                </PopoverContent>
              </Popover>
              {errors.tanggal && (
                <p className="text-xs text-destructive">{errors.tanggal}</p>
              )}
            </div>

            {/* Kategori */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Kategori</Label>
              <Select
                value={kategoriId}
                onValueChange={(val) => setKategoriId(val || "none")}
                disabled={isSubmitting}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa Kategori</SelectItem>
                  {kategoriList.map((kat) => (
                    <SelectItem key={kat.id} value={String(kat.id)}>
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: kat.warna }}
                        />
                        <span>{kat.nama}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Switch Status Aktif */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="add-active" className="text-sm font-medium cursor-pointer">
                Status Tayang
              </Label>
              <p className="text-xs text-muted-foreground">
                Aktifkan agar pengumuman langsung tampil di slide layar lobby.
              </p>
            </div>
            <Switch
              id="add-active"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Data"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
