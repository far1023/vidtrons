"use client"

import * as React from "react"
import { toast } from "sonner"
import { CalendarIcon, Clock, Loader2, MapPin } from "lucide-react"
import { format, parseISO } from "date-fns"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { updateAgendaSchema } from "@/lib/schemas/agenda.schema"

export interface AgendaItem {
  id: number
  judul: string
  tanggal: string
  mulai: string
  selesai: string
  lokasi: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface EditAgendaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: AgendaItem | null
  onRefresh: () => Promise<void> | void
}

export function EditAgendaDialog({
  open,
  onOpenChange,
  item,
  onRefresh,
}: EditAgendaDialogProps) {
  const [judul, setJudul] = React.useState("")
  const [tanggal, setTanggal] = React.useState("")
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined)
  const [mulai, setMulai] = React.useState("09:00")
  const [selesai, setSelesai] = React.useState("11:30")
  const [lokasi, setLokasi] = React.useState("")
  const [isActive, setIsActive] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    if (open && item) {
      setJudul(item.judul)
      setTanggal(item.tanggal)
      try {
        setSelectedDate(parseISO(item.tanggal))
      } catch {
        setSelectedDate(new Date())
      }
      // Strip seconds if present e.g. 09:00:00 -> 09:00
      setMulai(item.mulai.slice(0, 5))
      setSelesai(item.selesai.slice(0, 5))
      setLokasi(item.lokasi)
      setIsActive(item.isActive)
      setErrors({})
    }
  }, [open, item])

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
    if (!item) return
    setErrors({})

    const validation = updateAgendaSchema.safeParse({
      judul,
      tanggal,
      mulai,
      selesai,
      lokasi,
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
      const res = await fetch(`/api/admin/agenda/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
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
          toast.error(data?.error?.message || "Gagal memperbarui agenda")
        }
        return
      }

      toast.success("Agenda kegiatan berhasil diperbarui")
      onOpenChange(false)
      await onRefresh()
    } catch {
      toast.error("Terjadi kesalahan jaringan. Silakan coba lagi.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid =
    judul.trim().length > 0 &&
    tanggal.trim().length > 0 &&
    mulai.trim().length > 0 &&
    selesai.trim().length > 0 &&
    lokasi.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ubah Agenda Kegiatan</DialogTitle>
          <DialogDescription>
            Perbarui jadwal, waktu, atau lokasi kegiatan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-agenda-judul" className="text-sm font-medium">
                Nama / Judul Kegiatan <span className="text-destructive">*</span>
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
              id="edit-agenda-judul"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              rows={3}
              maxLength={500}
              className={`resize-none ${errors.judul ? "border-destructive" : ""}`}
              disabled={isSubmitting}
            />
            {errors.judul && (
              <p className="text-xs text-destructive">{errors.judul}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-1">
              <Label className="text-sm font-medium">
                Tanggal <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      className="h-9 w-full justify-start text-left font-normal"
                      disabled={isSubmitting}
                    >
                      <CalendarIcon className="mr-2 size-3.5" />
                      <span className="truncate">
                        {selectedDate
                          ? format(selectedDate, "dd/MM/yyyy")
                          : "Pilih tgl"}
                      </span>
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

            <div className="space-y-1.5">
              <Label htmlFor="edit-agenda-mulai" className="text-sm font-medium">
                Mulai <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Clock className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
                <Input
                  id="edit-agenda-mulai"
                  type="time"
                  value={mulai}
                  onChange={(e) => setMulai(e.target.value)}
                  className="h-9 pl-8 text-sm"
                  disabled={isSubmitting}
                />
              </div>
              {errors.mulai && (
                <p className="text-xs text-destructive">{errors.mulai}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-agenda-selesai" className="text-sm font-medium">
                Selesai <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Clock className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
                <Input
                  id="edit-agenda-selesai"
                  type="time"
                  value={selesai}
                  onChange={(e) => setSelesai(e.target.value)}
                  className="h-9 pl-8 text-sm"
                  disabled={isSubmitting}
                />
              </div>
              {errors.selesai && (
                <p className="text-xs text-destructive">{errors.selesai}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-agenda-lokasi" className="text-sm font-medium">
              Tempat / Ruang Kegiatan <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <MapPin className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
              <Input
                id="edit-agenda-lokasi"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                maxLength={255}
                className="h-9 pl-9 text-sm"
                disabled={isSubmitting}
              />
            </div>
            {errors.lokasi && (
              <p className="text-xs text-destructive">{errors.lokasi}</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="edit-agenda-active" className="text-sm font-medium cursor-pointer">
                Status Tayang
              </Label>
              <p className="text-xs text-muted-foreground">
                Aktifkan agar kegiatan muncul di panel agenda layar videotron.
              </p>
            </div>
            <Switch
              id="edit-agenda-active"
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
                "Simpan Perubahan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
