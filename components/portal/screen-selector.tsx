"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Clock,
  CornerDownLeft,
  ExternalLink,
  Layers,
  Lock,
  MonitorPlay,
  ShieldCheck,
  Tv,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

export interface ScreenOption {
  id: string
  title: string
  subtitle: string
  description: string
  href?: string
  status: "active" | "coming_soon" | "restricted"
  statusLabel: string
  icon: typeof MonitorPlay
  tags: string[]
  shortcutNumber: number
}

const SCREENS: ScreenOption[] = [
  {
    id: "lobby",
    title: "Layar Informasi Lobby",
    subtitle: "Videotron Utama Gedung Bappeda",
    description:
      "Tampilan layar 16:9 interaktif pasif untuk videotron lobi. Menampilkan jam & jadwal sholat Kota Dumai, cuaca BMKG, pemutar video profil daerah, indikator makro ekonomi Dumai, pengumuman resmi, agenda kegiatan, dan running text.",
    href: "/lobby",
    status: "active",
    statusLabel: "Aktif & Siap Tayang",
    icon: MonitorPlay,
    tags: ["16:9 Landscape", "Jadwal Sholat", "Makro Ekonomi", "Autoscroll 24/7"],
    shortcutNumber: 1,
  },
  {
    id: "pelayanan",
    title: "Display Ruang Pelayanan",
    subtitle: "Layar Antrean & Layanan Terpadu",
    description:
      "Tampilan informasi alur pelayanan publik terpadu, maklumat pelayanan, dan panduan administrasi perencanaan daerah untuk ruang front-office.",
    status: "coming_soon",
    statusLabel: "Segera Hadir",
    icon: Layers,
    tags: ["Front Office", "Informasi Layanan", "Tahap Persiapan"],
    shortcutNumber: 2,
  },
  {
    id: "admin",
    title: "Panel Pengelola Konten",
    subtitle: "Dashboard Petugas Bappeda",
    description:
      "Kelola seluruh jadwal penayangan, poster pengumuman, agenda dinas, running text berjalan, video YouTube/MP4, data statistik Dumai, dan akun petugas.",
    href: "/dashboard",
    status: "restricted",
    statusLabel: "Khusus Petugas",
    icon: ShieldCheck,
    tags: ["Autentikasi Pegawai", "CMS Konten", "Statistik Live"],
    shortcutNumber: 3,
  },
]

export function ScreenSelector() {
  const router = useRouter()
  const [selectedIndex, setSelectedIndex] = React.useState<number>(0)
  const itemRefs = React.useRef<(HTMLAnchorElement | HTMLDivElement | null)[]>([])

  // Ensure selected card is scrolled into view (crucial for TV screens)
  React.useEffect(() => {
    const el = itemRefs.current[selectedIndex]
    if (el) {
      el.focus?.({ preventScroll: true })
    }
  }, [selectedIndex])

  // Keyboard and TV remote control listener (D-pad arrow navigation, Enter/OK, Tab)
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept if user is typing into an input/textarea
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return
      }

      const total = SCREENS.length

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown": {
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % total)
          break
        }
        case "ArrowLeft":
        case "ArrowUp": {
          e.preventDefault()
          setSelectedIndex((prev) => (prev - 1 + total) % total)
          break
        }
        case "Enter":
        case " ": {
          // If active item has href, navigate immediately
          const current = SCREENS[selectedIndex]
          if (current?.href) {
            e.preventDefault()
            router.push(current.href)
          }
          break
        }
        case "1": {
          e.preventDefault()
          setSelectedIndex(0)
          break
        }
        case "2": {
          e.preventDefault()
          setSelectedIndex(1)
          break
        }
        case "3": {
          e.preventDefault()
          setSelectedIndex(2)
          break
        }
        default:
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [router, selectedIndex])

  return (
    <div className="space-y-6">
      {/* Remote & Keyboard Hint Banner */}
      <div className="mx-auto flex max-w-2xl items-center justify-center gap-2 rounded-xl border border-emerald-900/10 bg-emerald-50/60 px-4 py-2 text-center text-xs font-medium text-emerald-900 backdrop-blur-xs dark:bg-emerald-950/30 dark:text-emerald-300">
        <Tv className="size-4 shrink-0 text-emerald-600" />
        <span>
          Gunakan tombol panah{" "}
          <kbd className="rounded border border-emerald-300 bg-white px-1.5 py-0.5 font-mono text-[0.65rem] shadow-2xs dark:border-emerald-800 dark:bg-emerald-900">
            ◄
          </kbd>{" "}
          <kbd className="rounded border border-emerald-300 bg-white px-1.5 py-0.5 font-mono text-[0.65rem] shadow-2xs dark:border-emerald-800 dark:bg-emerald-900">
            ►
          </kbd>{" "}
          atau <kbd className="rounded border border-emerald-300 bg-white px-1.5 py-0.5 font-mono text-[0.65rem] shadow-2xs dark:border-emerald-800 dark:bg-emerald-900">Tab</kbd> pada remote/keyboard, lalu tekan{" "}
          <kbd className="rounded border border-emerald-300 bg-white px-1.5 py-0.5 font-mono text-[0.65rem] shadow-2xs dark:border-emerald-800 dark:bg-emerald-900">
            Enter / OK
          </kbd>
        </span>
      </div>

      {/* Grid of Screen Options */}
      <div
        role="radiogroup"
        aria-label="Pilihan Layar Informasi"
        className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 sm:gap-6"
      >
        {SCREENS.map((screen, index) => {
          const Icon = screen.icon
          const isSelected = selectedIndex === index
          const isActive = screen.status === "active"
          const isRestricted = screen.status === "restricted"
          const isComingSoon = screen.status === "coming_soon"

          const cardContent = (
            <Card
              className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-all duration-200 sm:p-6 ${
                isSelected
                  ? "border-emerald-600 bg-gradient-to-b from-white via-white to-emerald-50/40 shadow-xl shadow-emerald-900/15 ring-4 ring-emerald-500/40 ring-offset-2 ring-offset-background scale-[1.02] dark:from-card dark:via-card dark:to-emerald-950/20"
                  : isActive
                    ? "border-emerald-600/30 bg-card/90 shadow-md ring-1 ring-emerald-500/10 hover:border-emerald-500 hover:shadow-lg dark:bg-card"
                    : isRestricted
                      ? "border-border bg-card/80 shadow-xs hover:border-primary/40 hover:shadow-md"
                      : "cursor-not-allowed border-dashed border-border/80 bg-muted/20 opacity-75"
              }`}
            >
              {/* Top Accent Bar on Selected or Active */}
              {(isSelected || isActive) && (
                <div
                  className={`absolute inset-x-0 top-0 h-1.5 transition-colors ${
                    isSelected
                      ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 animate-pulse"
                      : "bg-emerald-600/60"
                  }`}
                />
              )}

              {/* Number Shortcut Badge (Top-Right Pill) */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-muted/60 font-mono text-[0.65rem] font-bold text-muted-foreground ring-1 ring-black/5">
                  {screen.shortcutNumber}
                </span>
              </div>

              <div>
                {/* Top Row: Icon & Status Badge */}
                <div className="flex items-start justify-between gap-3 pr-6">
                  <div
                    className={`flex size-11 items-center justify-center rounded-xl transition-all duration-200 sm:size-12 ${
                      isSelected
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-700/30 ring-2 ring-emerald-400"
                        : isActive
                          ? "bg-emerald-600/90 text-white shadow-xs group-hover:bg-emerald-700"
                          : isRestricted
                            ? "bg-primary/10 text-primary group-hover:bg-primary/20"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-5 sm:size-6" />
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {isActive && (
                      <Badge className="gap-1 border-0 bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow-xs">
                        <span className="size-1.5 animate-ping rounded-full bg-emerald-200" />
                        {screen.statusLabel}
                      </Badge>
                    )}

                    {isRestricted && (
                      <Badge
                        variant="secondary"
                        className="gap-1 px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                      >
                        <Lock className="size-3" />
                        {screen.statusLabel}
                      </Badge>
                    )}

                    {isComingSoon && (
                      <Badge
                        variant="outline"
                        className="border-dashed px-2.5 py-0.5 text-xs font-normal text-muted-foreground"
                      >
                        <Clock className="size-3" />
                        {screen.statusLabel}
                      </Badge>
                    )}

                    {/* Active Remote Selection indicator badge */}
                    {isSelected && screen.href && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-800 shadow-2xs dark:bg-emerald-900/60 dark:text-emerald-200">
                        <CornerDownLeft className="size-3" />
                        Tekan Enter
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Title & Content */}
                <div className="mt-4">
                  <p className="text-xs font-medium text-emerald-800/80 dark:text-emerald-400">
                    {screen.subtitle}
                  </p>
                  <h2
                    className={`mt-0.5 text-lg font-bold transition-colors sm:text-xl ${
                      isSelected
                        ? "text-emerald-950 dark:text-emerald-100"
                        : "text-foreground group-hover:text-emerald-700"
                    }`}
                  >
                    {screen.title}
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {screen.description}
                  </p>
                </div>
              </div>

              {/* Bottom Row: Tags & CTA */}
              <div className="mt-6 border-t border-border/60 pt-4">
                <div className="flex flex-wrap gap-1.5">
                  {screen.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-md bg-secondary/80 px-2 py-0.5 text-[0.68rem] font-medium text-secondary-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between pt-1">
                  <span
                    className={`text-xs font-semibold ${
                      isSelected
                        ? "text-emerald-700 underline underline-offset-2 dark:text-emerald-300"
                        : isActive
                          ? "text-emerald-700 group-hover:text-emerald-800"
                          : isRestricted
                            ? "text-primary"
                            : "text-muted-foreground"
                    }`}
                  >
                    {isActive
                      ? isSelected
                        ? "Buka Sekarang (Enter)"
                        : "Buka Layar Videotron"
                      : isRestricted
                        ? "Masuk ke Dashboard"
                        : "Belum Tersedia"}
                  </span>
                  <div
                    className={`flex size-7 items-center justify-center rounded-full transition-transform duration-200 ${
                      isSelected
                        ? "translate-x-1 bg-emerald-600 text-white shadow-xs"
                        : isActive
                          ? "bg-emerald-600/90 text-white shadow-xs group-hover:bg-emerald-700 group-hover:translate-x-1"
                          : isRestricted
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground/50"
                    }`}
                  >
                    {isActive ? (
                      <ArrowRight className="size-4" />
                    ) : isRestricted ? (
                      <ExternalLink className="size-3.5" />
                    ) : (
                      <Lock className="size-3.5" />
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )

          if (screen.href) {
            return (
              <Link
                key={screen.id}
                href={screen.href}
                ref={(el) => {
                  itemRefs.current[index] = el
                }}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onFocus={() => setSelectedIndex(index)}
                onMouseEnter={() => setSelectedIndex(index)}
                className="block h-full rounded-2xl outline-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                {cardContent}
              </Link>
            )
          }

          return (
            <div
              key={screen.id}
              ref={(el) => {
                itemRefs.current[index] = el
              }}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onFocus={() => setSelectedIndex(index)}
              onMouseEnter={() => setSelectedIndex(index)}
              className="h-full rounded-2xl outline-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              {cardContent}
            </div>
          )
        })}
      </div>
    </div>
  )
}
