"use client"

import * as React from "react"
import { toast } from "sonner"
import { CalendarIcon, Clock, Loader2, MapPin } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { createAgendaSchema } from "@/lib/schemas/agenda.schema"

interface AddAgendaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh: () => Promise<void> | void
}

function getTodayString(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function AddAgendaDialog({
  open,
  onOpenChange,
  onRefresh,
}: AddAgendaDialogProps) {
  const [judul, setJudul] = React.useState("")
  const [tanggal, setTanggal] = React.useState(getTodayString())
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date())
  const [mulai, setMulai] = React.useState("09:00")
  const [selesai, setSelesai] = React.useState("11:30")
  const [lokasi, setLokasi] = React.useState("")
  const [isActive, setIsActive] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    if (open) {
      setJudul("")
      const todayStr = getTodayString()
      setTanggal(todayStr)
      setSelectedDate(new Date())
      setMulai("09:00")
      setSelesai("11:30")
      setLokasi("")
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

    const validation = createAgendaSchema.safeParse({
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
      const res = await fetch("/api/admin/agenda", {
        method: "POST",
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
          toast.error(data?.error?.message || "Gagal menyimpan agenda")
        }
        return
      }

      toast.success("Agenda kegiatan berhasil ditambahkan")
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
          <DialogTitle>Tambah Agenda Kegiatan</DialogTitle>
          <DialogDescription>
            Jadwalkan agenda atau kegiatan dinas untuk ditampilkan pada jadwal harian lobby.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Judul Kegiatan */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="agenda-judul" className="text-sm font-medium">
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
              id="agenda-judul"
              placeholder="Contoh: Rapat Koordinasi Perencanaan Pembangunan Daerah..."
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
            {/* Tanggal */}
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

            {/* Jam Mulai */}
            <div className="space-y-1.5">
              <Label htmlFor="agenda-mulai" className="text-sm font-medium">
                Mulai <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Clock className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
                <Input
                  id="agenda-mulai"
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

            {/* Jam Selesai */}
            <div className="space-y-1.5">
              <Label htmlFor="agenda-selesai" className="text-sm font-medium">
                Selesai <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Clock className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
                <Input
                  id="agenda-selesai"
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

          {/* Lokasi */}
          <div className="space-y-1.5">
            <Label htmlFor="agenda-lokasi" className="text-sm font-medium">
              Tempat / Ruang Kegiatan <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <MapPin className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
              <Input
                id="agenda-lokasi"
                placeholder="Contoh: Ruang Rapat Wan Seri Beni Bappeda Lt. 2"
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

          {/* Status Aktif */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="agenda-active" className="text-sm font-medium cursor-pointer">
                Status Tayang
              </Label>
              <p className="text-xs text-muted-foreground">
                Aktifkan agar kegiatan muncul di panel agenda layar videotron.
              </p>
            </div>
            <Switch
              id="agenda-active"
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
