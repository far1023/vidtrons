"use client"

import * as React from "react"
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ImageIcon,
  Loader2,
  Minus,
  Plus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  Tipe & helper                                                             */
/* -------------------------------------------------------------------------- */

export interface PromoFormValues {
  judul: string
  gambarUrl: string
  /** Stored as a string so the field can be cleared while typing */
  urutan: string
  isActive: boolean
}

export const EMPTY_PROMO_VALUES: PromoFormValues = {
  judul: "",
  gambarUrl: "",
  urutan: "0",
  isActive: true,
}

export type PromoFormErrors = Record<string, string>

export function toPromoPayload(v: PromoFormValues) {
  const urutan = Number.parseInt(v.urutan, 10)
  return {
    judul: v.judul.trim(),
    gambarUrl: v.gambarUrl.trim(),
    urutan: Number.isFinite(urutan) && urutan >= 0 ? urutan : 0,
    isActive: v.isActive,
  }
}

/** Ubah tautan "bagikan" Google Drive menjadi tautan gambar langsung. */
export function normalizeImageUrl(raw: string): string {
  const url = raw.trim()
  const match =
    url.match(/drive\.google\.com\/file\/d\/([\w-]+)/) ||
    url.match(/drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=([\w-]+)/)
  return match ? `https://lh3.googleusercontent.com/d/${match[1]}=s0` : url
}

export function zodIssuesToErrors(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>
): PromoFormErrors {
  const out: PromoFormErrors = {}
  for (const issue of issues) {
    const key = issue.path[0] !== undefined ? String(issue.path[0]) : ""
    if (key && !out[key]) out[key] = issue.message
  }
  return out
}

export function apiDetailsToErrors(json: unknown): PromoFormErrors {
  const out: PromoFormErrors = {}
  const j = json as {
    details?: unknown
    error?: { details?: unknown }
  } | null
  const details = j?.details ?? j?.error?.details
  if (Array.isArray(details)) {
    for (const d of details as Array<{ field?: string; message?: string }>) {
      if (d?.field && d.message) out[d.field] = d.message
    }
  }
  return out
}

/* -------------------------------------------------------------------------- */
/*  Pratinjau gambar                                                          */
/* -------------------------------------------------------------------------- */

function PreviewImage({ url }: { url: string }) {
  // This component is remounted (key={url}) whenever the URL changes, so state is always fresh.
  const [status, setStatus] = React.useState<"loading" | "loaded" | "error">(
    "loading"
  )

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-2 px-6 text-center">
        <AlertCircle className="size-6 text-destructive" />
        <p className="text-sm font-medium text-destructive">
          Gambar tidak dapat dimuat
        </p>
        <p className="text-xs text-muted-foreground">
          Periksa kembali URL dan pastikan file dibagikan secara publik
          (&quot;Anyone with the link&quot;).
        </p>
      </div>
    )
  }

  return (
    <>
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {/* Plain img tag per project rule (avoid next/image quota/remote pattern) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Pratinjau gambar promo"
        className={cn(
          "size-full object-contain transition-opacity duration-200",
          status === "loaded" ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
      />
    </>
  )
}

function ImagePreview({ url }: { url: string }) {
  const trimmed = url.trim()
  const valid = trimmed.startsWith("https://")

  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5">
        <ImageIcon className="size-4 text-muted-foreground" />
        Pratinjau
      </Label>
      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
        {valid ? (
          <PreviewImage key={trimmed} url={trimmed} />
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 text-center">
            <ImageIcon className="size-8 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">
              Gambar akan tampil di sini setelah Anda mengisi URL yang valid.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Field bersama                                                             */
/* -------------------------------------------------------------------------- */

interface PromoFormFieldsProps {
  /** Id prefix to avoid collisions if two forms are ever rendered at the same time */
  idPrefix: string
  values: PromoFormValues
  onChange: (patch: Partial<PromoFormValues>) => void
  errors: PromoFormErrors
  disabled?: boolean
  judulPlaceholder?: string
}

export function PromoFormFields({
  idPrefix,
  values,
  onChange,
  errors,
  disabled,
  judulPlaceholder = "Contoh: Sosialisasi Musrenbang 2026",
}: PromoFormFieldsProps) {
  const [converted, setConverted] = React.useState(false)

  const id = (name: string) => `${idPrefix}-${name}`
  const url = values.gambarUrl.trim()
  const urlIsHttps = url.startsWith("https://")
  const urlLiveError =
    url.length > 0 && !urlIsHttps ? "URL harus diawali dengan https://" : ""
  const urlError = errors.gambarUrl || urlLiveError

  const applyNormalized = (raw: string) => {
    const normalized = normalizeImageUrl(raw)
    setConverted(normalized !== raw.trim())
    onChange({ gambarUrl: normalized })
  }

  const urutanNumber = Number.parseInt(values.urutan, 10) || 0
  const stepUrutan = (delta: number) =>
    onChange({ urutan: String(Math.max(0, urutanNumber + delta)) })

  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        {/* Kolom kiri: judul + URL */}
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor={id("judul")}>
              Judul promo <span className="text-destructive">*</span>
            </Label>
            <Input
              id={id("judul")}
              placeholder={judulPlaceholder}
              value={values.judul}
              onChange={(e) => onChange({ judul: e.target.value })}
              disabled={disabled}
              autoFocus
              autoComplete="off"
              aria-invalid={!!errors.judul}
              aria-describedby={errors.judul ? id("judul-error") : undefined}
            />
            {errors.judul && (
              <p id={id("judul-error")} className="text-xs text-destructive">
                {errors.judul}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={id("gambarUrl")}>
              URL gambar <span className="text-destructive">*</span>
            </Label>
            <Input
              id={id("gambarUrl")}
              type="url"
              inputMode="url"
              placeholder="Tempel tautan Google Drive atau URL gambar"
              value={values.gambarUrl}
              onChange={(e) => {
                setConverted(false)
                onChange({ gambarUrl: e.target.value })
              }}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text")
                if (normalizeImageUrl(text) !== text.trim()) {
                  e.preventDefault()
                  applyNormalized(text)
                }
              }}
              onBlur={(e) => applyNormalized(e.target.value)}
              disabled={disabled}
              autoComplete="off"
              aria-invalid={!!urlError}
              aria-describedby={id("gambarUrl-hint")}
            />

            <div id={id("gambarUrl-hint")} className="min-h-4 text-xs">
              {urlError ? (
                <p className="text-destructive">{urlError}</p>
              ) : converted ? (
                <p className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" />
                  Tautan Google Drive diubah otomatis menjadi tautan gambar
                  langsung.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Format JPG, PNG, atau WebP. Tautan Google Drive boleh langsung
                  ditempel.
                </p>
              )}
            </div>

            <details className="group rounded-md border bg-muted/30 text-xs">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 font-medium [&::-webkit-details-marker]:hidden">
                Cara memakai gambar dari Google Drive
                <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <ol className="list-decimal space-y-1 border-t px-3 py-2.5 pl-7 text-muted-foreground">
                <li>Unggah gambar ke Google Drive.</li>
                <li>
                  Klik kanan file, pilih <b>Bagikan</b>, lalu ubah akses menjadi{" "}
                  <b>&quot;Anyone with the link&quot;</b>.
                </li>
                <li>
                  Salin tautan dan tempel di kolom di atas. Tautan akan diubah
                  otomatis ke format:
                  <code className="mt-1 block rounded bg-background px-2 py-1 font-mono text-[11px] break-all text-foreground select-all">
                    https://lh3.googleusercontent.com/d/&#123;id&#125;=s0
                  </code>
                </li>
              </ol>
            </details>
          </div>
        </div>

        {/* Kolom kanan: pratinjau */}
        <div className="md:pt-0">
          <ImagePreview url={values.gambarUrl} />
        </div>
      </div>

      {/* Urutan & status */}
      <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={id("urutan")}>Urutan tampil</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => stepUrutan(-1)}
              disabled={disabled || urutanNumber <= 0}
              aria-label="Kurangi urutan"
            >
              <Minus className="size-4" />
            </Button>
            <Input
              id={id("urutan")}
              type="number"
              inputMode="numeric"
              min={0}
              className="text-center"
              value={values.urutan}
              onChange={(e) => onChange({ urutan: e.target.value })}
              onBlur={() => onChange({ urutan: String(urutanNumber) })}
              disabled={disabled}
              aria-invalid={!!errors.urutan}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => stepUrutan(1)}
              disabled={disabled}
              aria-label="Tambah urutan"
            >
              <Plus className="size-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Angka terkecil tampil lebih dulu dalam rotasi slide.
          </p>
          {errors.urutan && (
            <p className="text-xs text-destructive">{errors.urutan}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={id("isActive")}>Status tayang</Label>
          <label
            htmlFor={id("isActive")}
            className={cn(
              "flex min-h-9 cursor-pointer items-center justify-between gap-3 rounded-md border px-3 py-1.5 transition-colors",
              values.isActive
                ? "border-emerald-600/40 bg-emerald-50/70 dark:bg-emerald-950/20"
                : "bg-muted/30",
              disabled && "cursor-not-allowed opacity-60"
            )}
          >
            <span className="text-sm font-medium">
              {values.isActive ? "Aktif" : "Nonaktif"}
            </span>
            <Switch
              id={id("isActive")}
              checked={values.isActive}
              onCheckedChange={(checked) => onChange({ isActive: checked })}
              disabled={disabled}
            />
          </label>
          <p className="text-xs text-muted-foreground">
            {values.isActive
              ? "Gambar ditampilkan di layar videotron."
              : "Gambar disimpan tetapi tidak ditampilkan."}
          </p>
        </div>
      </div>
    </div>
  )
}
