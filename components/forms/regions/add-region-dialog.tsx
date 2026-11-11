"use client"

import * as React from "react"
import { toast } from "sonner"
import { Loader2, Plus, RotateCcw } from "lucide-react"

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
import { createRegionSchema } from "@/lib/schemas/region.schema"
import { REGION_FALLBACK_PALETTE } from "@/lib/makro-ekonomi"
import type { RegionAdminItem } from "./edit-region-dialog"

interface AddRegionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  regions: RegionAdminItem[]
  onRefresh: () => Promise<void> | void
}

export function AddRegionDialog({
  open,
  onOpenChange,
  regions,
  onRefresh,
}: AddRegionDialogProps) {
  const [kode, setKode] = React.useState("")
  const [nama, setNama] = React.useState("")
  const [level, setLevel] = React.useState<"nasional" | "provinsi" | "kabkota">(
    "kabkota"
  )
  const [parentId, setParentId] = React.useState<string>("none")
  const [useCustomColor, setUseCustomColor] = React.useState(false)
  const [warna, setWarna] = React.useState("#059669")
  const [isActive, setIsActive] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Default parent when level changes
  const candidateParents = React.useMemo(() => {
    if (level === "nasional") return []
    if (level === "provinsi") {
      return regions.filter((r) => r.level === "nasional")
    }
    return regions.filter((r) => r.level === "provinsi")
  }, [regions, level])

  React.useEffect(() => {
    if (open) {
      setKode("")
      setNama("")
      setLevel("kabkota")
      const defaultProv =
        regions.find((r) => r.level === "provinsi" && r.kode === "14") ??
        regions.find((r) => r.level === "provinsi")
      setParentId(defaultProv ? String(defaultProv.id) : "none")
      setUseCustomColor(false)
      setWarna("#059669")
      setIsActive(true)
      setErrors({})
    }
  }, [open, regions])

  const handleLevelChange = (
    nextLevel: "nasional" | "provinsi" | "kabkota"
  ) => {
    setLevel(nextLevel)
    if (nextLevel === "nasional") {
      setParentId("none")
    } else if (nextLevel === "provinsi") {
      const nas = regions.find((r) => r.level === "nasional")
      setParentId(nas ? String(nas.id) : "none")
    } else {
      const prov =
        regions.find((r) => r.level === "provinsi" && r.kode === "14") ??
        regions.find((r) => r.level === "provinsi")
      setParentId(prov ? String(prov.id) : "none")
    }
  }

  const isFormValid = kode.trim().length > 0 && nama.trim().length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const parsedParentId =
      level === "nasional" || parentId === "none" || !parentId
        ? null
        : parseInt(parentId, 10)

    const payload = {
      kode: kode.trim(),
      nama: nama.trim(),
      level,
      parentId: parsedParentId,
      warna: useCustomColor ? warna.trim() : null,
      isActive,
    }

    const validation = createRegionSchema.safeParse(payload)
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of validation.error.issues) {
        const path = issue.path[0]?.toString() || "kode"
        fieldErrors[path] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/admin/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      })

      const json = await res.json()
      if (!res.ok) {
        if (json.error?.details) {
          const apiErrors: Record<string, string> = {}
          for (const [key, msgs] of Object.entries(
            json.error.details as Record<string, string[]>
          )) {
            if (Array.isArray(msgs) && msgs[0]) apiErrors[key] = msgs[0]
          }
          setErrors(apiErrors)
        }
        throw new Error(json.error?.message || "Gagal menambahkan wilayah")
      }

      toast.success(`Wilayah ${validation.data.nama} berhasil ditambahkan`)
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
      <DialogContent className="sm:max-w-[540px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-4 text-emerald-700" />
              Tambah Wilayah Pembanding
            </DialogTitle>
            <DialogDescription>
              Tambahkan wilayah baru (Nasional, Provinsi, atau Kabupaten/Kota)
              menggunakan kode Kemendagri.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="add-region-kode">Kode Kemendagri *</Label>
                <Input
                  id="add-region-kode"
                  value={kode}
                  onChange={(e) => setKode(e.target.value)}
                  placeholder="Contoh: 14.72"
                  maxLength={16}
                  aria-invalid={!!errors.kode}
                  className={`font-mono ${errors.kode ? "border-destructive" : ""}`}
                />
                {errors.kode && (
                  <p className="text-xs text-destructive">{errors.kode}</p>
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="add-region-nama">Nama Wilayah *</Label>
                <Input
                  id="add-region-nama"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Kota Dumai"
                  maxLength={100}
                  aria-invalid={!!errors.nama}
                  className={errors.nama ? "border-destructive" : ""}
                />
                {errors.nama && (
                  <p className="text-xs text-destructive">{errors.nama}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="add-region-level">Tingkat Wilayah *</Label>
                <Select
                  value={level}
                  onValueChange={(val) => {
                    if (val)
                      handleLevelChange(
                        val as "nasional" | "provinsi" | "kabkota"
                      )
                  }}
                >
                  <SelectTrigger id="add-region-level" className="w-full">
                    <SelectValue placeholder="Pilih tingkat">
                      {(val: string | null) => {
                        if (val === "nasional") return "Nasional"
                        if (val === "provinsi") return "Provinsi"
                        return "Kabupaten / Kota"
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nasional">Nasional</SelectItem>
                    <SelectItem value="provinsi">Provinsi</SelectItem>
                    <SelectItem value="kabkota">Kabupaten / Kota</SelectItem>
                  </SelectContent>
                </Select>
                {errors.level && (
                  <p className="text-xs text-destructive">{errors.level}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-region-parent">Wilayah Induk</Label>
                <Select
                  value={level === "nasional" ? "none" : parentId}
                  onValueChange={(val) => {
                    if (val) setParentId(val)
                  }}
                  disabled={level === "nasional"}
                >
                  <SelectTrigger id="add-region-parent" className="w-full">
                    <SelectValue placeholder="Pilih wilayah induk">
                      {(val: string | null) => {
                        if (!val || val === "none") return "Tidak ada induk"
                        const found = regions.find((r) => String(r.id) === val)
                        return found ? `${found.nama} (${found.kode})` : val
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak ada induk</SelectItem>
                    {candidateParents.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.nama} ({p.kode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.parentId && (
                  <p className="text-xs text-destructive">{errors.parentId}</p>
                )}
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="add-custom-color-switch"
                    className="cursor-pointer text-sm font-medium"
                  >
                    Gunakan Warna Grafik Kustom
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Jika dimatikan, warna grafik dipilih otomatis dari palet
                    kontras.
                  </p>
                </div>
                <Switch
                  id="add-custom-color-switch"
                  checked={useCustomColor}
                  onCheckedChange={(checked) => {
                    setUseCustomColor(checked)
                    setErrors((prev) => {
                      const next = { ...prev }
                      delete next.warna
                      return next
                    })
                  }}
                />
              </div>

              {useCustomColor && (
                <div className="space-y-3 border-t pt-2">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="add-region-warna-hex"
                      className="text-xs font-medium"
                    >
                      Kode Warna Hex (#RRGGBB)
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        aria-label="Pemilih warna grafik"
                        value={
                          /^#[0-9a-fA-F]{6}$/.test(warna.trim())
                            ? warna.trim()
                            : "#059669"
                        }
                        onChange={(e) => setWarna(e.target.value)}
                        className="h-9 w-12 cursor-pointer rounded border bg-background p-1"
                      />
                      <Input
                        id="add-region-warna-hex"
                        value={warna}
                        onChange={(e) => setWarna(e.target.value)}
                        placeholder="#059669"
                        maxLength={7}
                        className="font-mono text-sm uppercase"
                        aria-invalid={!!errors.warna}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setUseCustomColor(false)}
                        className="shrink-0 text-xs text-muted-foreground"
                      >
                        <RotateCcw className="mr-1 size-3.5" />
                        Otomatis
                      </Button>
                    </div>
                    {errors.warna && (
                      <p className="text-xs text-destructive">{errors.warna}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Pilihan Cepat Palet Kontras:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {REGION_FALLBACK_PALETTE.map((hex) => {
                        const isSelected =
                          warna.trim().toLowerCase() === hex.toLowerCase()
                        return (
                          <button
                            key={hex}
                            type="button"
                            onClick={() => setWarna(hex)}
                            className={`size-6 cursor-pointer rounded-full border transition-transform ${
                              isSelected
                                ? "scale-110 ring-2 ring-emerald-600 ring-offset-2"
                                : "hover:scale-105"
                            }`}
                            style={{ backgroundColor: hex }}
                            title={`Pilih warna ${hex}`}
                            aria-label={`Pilih warna ${hex}`}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label
                  htmlFor="add-region-active"
                  className="cursor-pointer text-sm font-medium"
                >
                  Status Aktif Wilayah
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Wilayah aktif muncul pada filter pembanding di halaman publik.
                </p>
              </div>
              <Switch
                id="add-region-active"
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
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
