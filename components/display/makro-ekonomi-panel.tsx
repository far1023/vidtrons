"use client"

import { useState, useEffect } from "react"
import QRCode from "qrcode"
import {
  ArrowDown,
  ArrowUp,
  Minus,
  QrCode,
  type LucideIcon,
} from "lucide-react"

import { Marquee } from "@/components/display/marquee"
import { Panel } from "@/components/display/panel"
import { cn } from "@/lib/utils"

export type MakroEkonomiItem = {
  id?: number
  judul: string
  nilai: string
  satuan: string
  tahun: string
  tren:
    | "naik_positif"
    | "turun_positif"
    | "turun_negatif"
    | "naik_negatif"
    | "tetap"
    | "naik"
    | "turun"
  urutan?: number
}

export type MakroEkonomiPanelProps = {
  items?: MakroEkonomiItem[]
  qrUrl?: string | null
  qrLabel?: string | null
  deskripsi?: string | null
  className?: string
  /** Kecepatan gerak ticker (px per detik) */
  speed?: number
}

const DEFAULT_ITEMS: MakroEkonomiItem[] = [
  {
    judul: "Pertumbuhan Ekonomi",
    nilai: "0,00",
    satuan: "%",
    tahun: "2024",
    tren: "tetap",
  },
  {
    judul: "Inflasi Tahunan",
    nilai: "0,00",
    satuan: "%",
    tahun: "2024",
    tren: "tetap",
  },
  {
    judul: "Indeks Pembangunan Manusia",
    nilai: "0,00",
    satuan: "Poin",
    tahun: "2024",
    tren: "tetap",
  },
  {
    judul: "Tingkat Pengangguran Terbuka",
    nilai: "0,00",
    satuan: "%",
    tahun: "2024",
    tren: "tetap",
  },
  {
    judul: "Tingkat Kemiskinan",
    nilai: "0,00",
    satuan: "%",
    tahun: "2024",
    tren: "tetap",
  },
  {
    judul: "PDRB ADHB",
    nilai: "0,00",
    satuan: "Triliun",
    tahun: "2024",
    tren: "tetap",
  },
]

export function MakroEkonomiPanel({
  items,
  qrUrl,
  qrLabel,
  deskripsi,
  className,
  speed = 60,
}: MakroEkonomiPanelProps) {
  const [qrError, setQrError] = useState(false)
  const [defaultQrDataUrl, setDefaultQrDataUrl] = useState<string | null>(null)
  const displayItems = items && items.length > 0 ? items : DEFAULT_ITEMS

  // Reset qrError saat prop qrUrl berubah
  useEffect(() => {
    setQrError(false)
  }, [qrUrl])

  // Generate QR code default ke /grafik-makro-ekonomi menggunakan library qrcode
  useEffect(() => {
    const targetUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/grafik-makro-ekonomi`
        : "/grafik-makro-ekonomi"

    QRCode.toDataURL(targetUrl, {
      width: 280,
      margin: 1,
      color: {
        dark: "#064e3b",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
      .then((dataUrl) => setDefaultQrDataUrl(dataUrl))
      .catch((err) => {
        console.error("Gagal membuat QR Code default:", err)
      })
  }, [])

  // Jika user sudah pernah input manual di DB (qrUrl), gunakan dari DB.
  // Jika tidak ada atau error, gunakan hasil generate default.
  const effectiveQr = qrUrl && !qrError ? qrUrl : defaultQrDataUrl
  const labelText = qrLabel || (qrUrl ? "Pindai Data" : "Grafik Makro")

  return (
    <Panel
      className={cn(
        "relative flex min-h-0 flex-row items-stretch gap-3.5 overflow-hidden p-2.5 select-none sm:gap-4 sm:p-3",
        "bg-white/90 shadow-[0_8px_30px_-12px_rgba(6,78,59,0.25)] ring-1 ring-black/5",
        className
      )}
    >
      {/* Kolom kiri: ticker + deskripsi */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="relative flex min-w-0 flex-1 items-center overflow-hidden">
          {/* Mask pudar tepi kiri & kanan */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-linear-to-r from-white to-transparent sm:w-14" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l from-white to-transparent sm:w-14" />

          <Marquee speed={speed} className="w-full">
            {displayItems.map((item, idx) => (
              <IndicatorItem key={item.id ?? idx} item={item} />
            ))}
          </Marquee>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-emerald-950/10 px-1 pt-2 text-emerald-950/70">
          <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-emerald-500" />
          <p className="line-clamp-1 text-sm font-medium tracking-wide text-emerald-900/80">
            {deskripsi ||
              "Data Indikator Utama Pembangunan Kota Dumai • Sumber Resmi BPS Kota Dumai"}
          </p>
        </div>
      </div>

      {/* QR Code 1:1 di sisi kanan */}
      <div
        className="relative flex aspect-square h-full shrink-0 flex-col items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-xs ring-1 ring-emerald-950/10"
        title={labelText}
      >
        {effectiveQr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={effectiveQr}
            src={effectiveQr}
            alt={labelText}
            className="h-full w-full object-contain"
            onError={() => {
              if (qrUrl && !qrError) {
                setQrError(true)
              }
            }}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-xl bg-emerald-50/70 p-2 text-center">
            <QrCode className="size-8 animate-pulse text-emerald-700" />
            <span className="mt-1 line-clamp-1 text-xs font-bold text-emerald-900">
              {labelText}
            </span>
          </div>
        )}
      </div>
    </Panel>
  )
}

type TrenStyle = { icon: LucideIcon; label: string; color: string }

// Warna = penilaian (hijau baik, merah buruk), panah = arah perubahan
const POSITIF = "text-emerald-600"
const NEGATIF = "text-rose-600"
const NETRAL = "text-slate-400"

const TREN_STYLES: Record<MakroEkonomiItem["tren"], TrenStyle> = {
  naik_positif: { icon: ArrowUp, label: "naik", color: POSITIF },
  naik: { icon: ArrowUp, label: "naik", color: POSITIF },
  turun_positif: { icon: ArrowDown, label: "turun", color: POSITIF },
  turun_negatif: { icon: ArrowDown, label: "turun", color: NEGATIF },
  turun: { icon: ArrowDown, label: "turun", color: NEGATIF },
  naik_negatif: { icon: ArrowUp, label: "naik", color: NEGATIF },
  tetap: { icon: Minus, label: "stabil", color: NETRAL },
}

/**
 * Satu indikator tanpa card: judul kecil, nilai besar, panah tren berwarna di
 * samping nilai. Garis tipis di ujung kanan memisahkan antar indikator
 * (termasuk di sambungan loop, jadi marquee tetap rapi).
 */
function IndicatorItem({ item }: { item: MakroEkonomiItem }) {
  const tren = TREN_STYLES[item.tren]
  const Icon = tren?.icon

  return (
    <div className="flex shrink-0 items-center">
      <div className="flex flex-col gap-1 px-6 whitespace-nowrap sm:px-8">
        <div className="flex items-baseline gap-2">
          <span className="text-[clamp(1.05rem,1.35vw,1.2rem)] font-semibold text-emerald-900/80">
            {item.judul}
          </span>
          <span className="text-[clamp(1.05rem,1.35vw,1.3rem)] font-medium text-emerald-900/45">
            {item.tahun}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl leading-none font-black tracking-tight text-emerald-950 tabular-nums sm:text-4xl md:text-5xl">
              {item.nilai}
            </span>
            <span className="text-[clamp(1.05rem,1.35vw,1.4rem)] font-bold text-emerald-800/70">
              {item.satuan}
            </span>
          </div>

          {Icon && (
            <>
              <Icon
                aria-hidden
                className={cn(
                  "size-6 shrink-0 stroke-[3] sm:size-7 md:size-9",
                  tren.color
                )}
              />
              <span className="sr-only">{tren.label}</span>
            </>
          )}
        </div>
      </div>

      <span
        aria-hidden
        className="h-12 w-px shrink-0 bg-emerald-950/15 md:h-14"
      />
    </div>
  )
}
