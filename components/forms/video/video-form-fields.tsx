"use client"

import * as React from "react"
import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  Film,
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

export interface VideoFormValues {
  judul: string
  url: string
  /** Disimpan sebagai string agar kolom bisa dikosongkan saat mengetik */
  urutan: string
  isActive: boolean
}

export const EMPTY_VIDEO_VALUES: VideoFormValues = {
  judul: "",
  url: "",
  urutan: "0",
  isActive: true,
}

export type VideoFormErrors = Record<string, string>

export function toVideoPayload(v: VideoFormValues) {
  const urutan = Number.parseInt(v.urutan, 10)
  return {
    judul: v.judul.trim(),
    url: v.url.trim(),
    urutan: Number.isFinite(urutan) && urutan >= 0 ? urutan : 0,
    isActive: v.isActive,
  }
}

export type UrlProblem = { level: "error" | "warning"; message: string }

/**
 * Periksa URL video sebelum dikirim. "error" memblokir penyimpanan karena
 * pasti tidak bisa diputar oleh tag <video>; "warning" hanya peringatan.
 */
export function detectUrlProblem(raw: string): UrlProblem | null {
  const value = raw.trim()
  if (!value) return null

  if (!value.startsWith("https://")) {
    return { level: "error", message: "URL harus diawali dengan https://" }
  }

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return { level: "error", message: "Format URL tidak valid." }
  }

  const host = parsed.hostname.toLowerCase()
  const isHost = (domain: string) =>
    host === domain || host.endsWith(`.${domain}`)

  if (
    ["youtube.com", "youtu.be", "youtube-nocookie.com", "vimeo.com"].some(
      isHost
    )
  ) {
    return {
      level: "error",
      message:
        "Tautan YouTube/Vimeo tidak bisa diputar langsung. Gunakan tautan file video MP4 atau WebM.",
    }
  }

  if (isHost("drive.google.com")) {
    return {
      level: "warning",
      message:
        "Google Drive sering gagal memutar video (kuota unduhan dan halaman konfirmasi). Disarankan memakai hosting sendiri.",
    }
  }

  if (!/\.(mp4|webm|ogv|m4v)$/i.test(parsed.pathname)) {
    return {
      level: "warning",
      message:
        "URL tidak berakhiran .mp4 atau .webm. Pastikan ini tautan langsung ke file video.",
    }
  }

  return null
}

export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds)) return "tanpa durasi (siaran langsung)"
  const s = Math.round(totalSeconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, "0")
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`
}

export function zodIssuesToErrors(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>
): VideoFormErrors {
  const out: VideoFormErrors = {}
  for (const issue of issues) {
    const key = issue.path[0] !== undefined ? String(issue.path[0]) : ""
    if (key && !out[key]) out[key] = issue.message
  }
  return out
}

export function apiDetailsToErrors(json: unknown): VideoFormErrors {
  const out: VideoFormErrors = {}
  const j = json as { details?: unknown; error?: { details?: unknown } } | null
  const details = j?.details ?? j?.error?.details
  if (Array.isArray(details)) {
    for (const d of details as Array<{ field?: string; message?: string }>) {
      if (d?.field && d.message) out[d.field] = d.message
    }
  }
  return out
}

/* -------------------------------------------------------------------------- */
/*  Pratinjau video                                                           */
/* -------------------------------------------------------------------------- */

const PREVIEW_BOX =
  "relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border bg-black"

type VideoMeta = { duration: number; width: number; height: number }

function PreviewVideo({ url }: { url: string }) {
  // Di-remount lewat key={url}, jadi state selalu segar untuk URL baru.
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">(
    "loading"
  )
  const [meta, setMeta] = React.useState<VideoMeta | null>(null)

  return (
    <>
      <div className={PREVIEW_BOX}>
        {status === "error" ? (
          <div className="flex flex-col items-center gap-2 px-6 text-center">
            <AlertCircle className="size-6 text-red-400" />
            <p className="text-sm font-medium text-red-400">
              Video tidak dapat diputar
            </p>
            <p className="text-xs text-white/60">
              Pastikan URL langsung ke file video (MP4/WebM, codec H.264) dan
              server mengizinkan akses publik.
            </p>
          </div>
        ) : (
          <>
            {status === "loading" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="size-6 animate-spin text-white/70" />
              </div>
            )}
            <video
              src={url}
              controls
              playsInline
              preload="metadata"
              className="size-full bg-black object-contain"
              onLoadedMetadata={(e) => {
                const v = e.currentTarget
                setMeta({
                  duration: v.duration,
                  width: v.videoWidth,
                  height: v.videoHeight,
                })
                setStatus("ready")
              }}
              onError={() => setStatus("error")}
            />
          </>
        )}
      </div>

      {meta && status === "ready" && (
        <div className="space-y-0.5 text-xs text-muted-foreground">
          <p>
            Durasi {formatDuration(meta.duration)}, resolusi {meta.width}×
            {meta.height}
          </p>
          {meta.height > meta.width && (
            <p className="text-amber-700 dark:text-amber-400">
              Video berformat potret. Di panel 16:9 videotron, sisi atas dan
              bawahnya akan terpotong atau muncul bilah hitam.
            </p>
          )}
        </div>
      )}
    </>
  )
}

function VideoPreview({ url, blocked }: { url: string; blocked: boolean }) {
  const trimmed = url.trim()
  const canPreview = trimmed.startsWith("https://") && !blocked

  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5">
        <Film className="size-4 text-muted-foreground" />
        Pratinjau
      </Label>
      {canPreview ? (
        <PreviewVideo key={trimmed} url={trimmed} />
      ) : (
        <div className={PREVIEW_BOX}>
          <div className="flex flex-col items-center gap-2 px-6 text-center">
            <Film className="size-8 text-white/30" />
            <p className="text-xs text-white/60">
              Pemutar akan tampil di sini setelah Anda mengisi URL video yang
              valid.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Field bersama                                                             */
/* -------------------------------------------------------------------------- */

interface VideoFormFieldsProps {
  idPrefix: string
  values: VideoFormValues
  onChange: (patch: Partial<VideoFormValues>) => void
  errors: VideoFormErrors
  disabled?: boolean
  judulPlaceholder?: string
}

export function VideoFormFields({
  idPrefix,
  values,
  onChange,
  errors,
  disabled,
  judulPlaceholder = "Contoh: Profil Bappeda Kota Dumai 2026",
}: VideoFormFieldsProps) {
  const id = (name: string) => `${idPrefix}-${name}`
  const problem = detectUrlProblem(values.url)
  const urlError =
    errors.url || (problem?.level === "error" ? problem.message : "")

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
              Judul video <span className="text-destructive">*</span>
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
            <Label htmlFor={id("url")}>
              URL video <span className="text-destructive">*</span>
            </Label>
            <Input
              id={id("url")}
              type="url"
              inputMode="url"
              placeholder="https://contoh.go.id/video/profil.mp4"
              value={values.url}
              onChange={(e) => onChange({ url: e.target.value })}
              onBlur={(e) => onChange({ url: e.target.value.trim() })}
              disabled={disabled}
              autoComplete="off"
              aria-invalid={!!urlError}
              aria-describedby={id("url-hint")}
            />

            <div id={id("url-hint")} className="min-h-4 text-xs">
              {urlError ? (
                <p className="flex items-start gap-1 text-destructive">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                  {urlError}
                </p>
              ) : problem?.level === "warning" ? (
                <p className="flex items-start gap-1 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  {problem.message}
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Tautan langsung ke file MP4 atau WebM.
                </p>
              )}
            </div>

            <details className="group rounded-md border bg-muted/30 text-xs">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 font-medium [&::-webkit-details-marker]:hidden">
                Persyaratan file video
                <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <ul className="list-disc space-y-1 border-t px-3 py-2.5 pl-7 text-muted-foreground">
                <li>
                  Format <b>MP4</b> (video H.264, audio AAC) paling kompatibel
                  dengan semua browser.
                </li>
                <li>
                  Resolusi 1080p sudah cukup. Ukuran file lebih kecil memuat
                  lebih cepat.
                </li>
                <li>
                  File harus dapat diakses publik dari hosting sendiri, bukan
                  tautan YouTube.
                </li>
                <li>Video diputar tanpa suara di videotron.</li>
              </ul>
            </details>
          </div>
        </div>

        {/* Kolom kanan: pratinjau */}
        <VideoPreview url={values.url} blocked={problem?.level === "error"} />
      </div>

      {/* Urutan & status */}
      <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={id("urutan")}>Urutan putar</Label>
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
            Angka terkecil diputar lebih dulu dalam daftar putar.
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
              ? "Video ikut diputar bergantian di videotron."
              : "Video disimpan tetapi tidak diputar."}
          </p>
        </div>
      </div>
    </div>
  )
}
