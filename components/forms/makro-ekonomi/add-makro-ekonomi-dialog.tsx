"use client"

import * as React from "react"
import { toast } from "sonner"
import { ArrowDownRight, ArrowUpRight, Loader2, Minus } from "lucide-react"

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
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createMakroEkonomiSchema } from "@/lib/schemas/makro-ekonomi.schema"

interface AddMakroEkonomiDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh: () => Promise<void> | void
}

export function AddMakroEkonomiDialog({
  open,
  onOpenChange,
  onRefresh,
}: AddMakroEkonomiDialogProps) {
  const [judul, setJudul] = React.useState("")
  const [nilai, setNilai] = React.useState("")
  const [satuan, setSatuan] = React.useState("%")
  const [tahun, setTahun] = React.useState(new Date().getFullYear().toString())
  const [tren, setTren] = React.useState<string>("naik_positif")
  const [urutan, setUrutan] = React.useState("0")
  const [isActive, setIsActive] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    if (open) {
      setJudul("")
      setNilai("")
      setSatuan("%")
      setTahun(new Date().getFullYear().toString())
      setTren("naik_positif")
      setUrutan("0")
      setIsActive(true)
      setErrors({})
    }
  }, [open])

  const isFormValid = judul.trim().length > 0 && nilai.trim().length > 0 && tahun.trim().length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const payload = {
      judul: judul.trim(),
      nilai: nilai.trim(),
      satuan: satuan.trim() || "%",
      tahun: tahun.trim(),
      tren,
      urutan: parseInt(urutan, 10) || 0,
      isActive,
    }

    const validation = createMakroEkonomiSchema.safeParse(payload)
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
      const res = await fetch("/api/admin/makro-ekonomi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error?.message || "Gagal menambahkan data indikator")
      }

      toast.success("Indikator makro ekonomi berhasil ditambahkan")
      onOpenChange(false)
      await onRefresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Tambah Indikator Makro Ekonomi</DialogTitle>
            <DialogDescription>
              Tambahkan indikator makro ekonomi Kota Dumai untuk ditampilkan pada carousel videotron.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="judul">Nama Indikator *</Label>
              <Input
                id="judul"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Contoh: Pertumbuhan Ekonomi atau Tingkat Pengangguran Terbuka"
                maxLength={100}
                aria-invalid={!!errors.judul}
                className={errors.judul ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.judul && <p className="text-xs text-destructive">{errors.judul}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nilai">Nilai / Angka *</Label>
                <Input
                  id="nilai"
                  value={nilai}
                  onChange={(e) => setNilai(e.target.value)}
                  placeholder="Contoh: 5,21"
                  maxLength={50}
                  aria-invalid={!!errors.nilai}
                  className={errors.nilai ? "border-destructive" : ""}
                />
                {errors.nilai && <p className="text-xs text-destructive">{errors.nilai}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="satuan">Satuan</Label>
                <Input
                  id="satuan"
                  value={satuan}
                  onChange={(e) => setSatuan(e.target.value)}
                  placeholder="Contoh: % atau Poin"
                  maxLength={20}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tahun">Tahun / Periode *</Label>
                <Input
                  id="tahun"
                  value={tahun}
                  onChange={(e) => setTahun(e.target.value)}
                  placeholder="Contoh: 2024 atau 2024 (Q3)"
                  maxLength={20}
                  aria-invalid={!!errors.tahun}
                  className={errors.tahun ? "border-destructive" : ""}
                />
                {errors.tahun && <p className="text-xs text-destructive">{errors.tahun}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="urutan">Nomor Urutan</Label>
                <Input
                  id="urutan"
                  type="number"
                  min={0}
                  value={urutan}
                  onChange={(e) => setUrutan(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tren">Tren Indikator</Label>
              <Select value={tren} onValueChange={(val) => { if (val) setTren(val) }}>
                <SelectTrigger id="tren" className="w-full">
                  <SelectValue placeholder="Pilih tren" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="naik_positif">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <ArrowUpRight className="size-4 shrink-0" />
                      <span className="font-medium">Naik — Positif / Baik (e.g. Pertumbuhan Ekonomi, IPM, PDRB)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="turun_positif">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <ArrowDownRight className="size-4 shrink-0" />
                      <span className="font-medium">Turun — Membaik / Positif (e.g. Pengangguran/TPT, Kemiskinan)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="turun_negatif">
                    <div className="flex items-center gap-2 text-rose-700">
                      <ArrowDownRight className="size-4 shrink-0" />
                      <span className="font-medium">Turun — Buruk / Negatif (e.g. Pertumbuhan Ekonomi turun)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="naik_negatif">
                    <div className="flex items-center gap-2 text-rose-700">
                      <ArrowUpRight className="size-4 shrink-0" />
                      <span className="font-medium">Naik — Waspada / Negatif (e.g. Pengangguran / Kemiskinan naik)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="tetap">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Minus className="size-4 shrink-0" />
                      <span className="font-medium">Stabil / Tetap (▬)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Catatan: Untuk indikator seperti Tingkat Pengangguran Terbuka (TPT) atau Kemiskinan, tren turun merupakan capaian baik/positif (ditampilkan dengan warna hijau).
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-2.5">
              <Label htmlFor="is-active" className="text-sm font-medium cursor-pointer">
                Status Aktif
              </Label>
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={!isFormValid || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
