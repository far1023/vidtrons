import type { Metadata } from "next"
import Image from "next/image"
import { Radio, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { ScreenSelector } from "@/components/portal/screen-selector"

export const metadata: Metadata = {
  title: "Portal Layar Informasi - Bappeda Kota Dumai",
  description:
    "Portal pemilihan layar informasi digital videotron dan panel operasional Bappeda Kota Dumai.",
}

export default function Page() {
  return (
    <main className="relative flex min-h-screen flex-col justify-between overflow-x-hidden bg-radial-[at_top_center] from-emerald-50/70 via-background to-background text-foreground antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Decorative ambient background accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl"
      >
        <div className="aspect-[1108/632] w-[69.25rem] flex-none bg-gradient-to-tr from-emerald-200/40 via-teal-100/30 to-amber-100/20 opacity-60" />
      </div>

      {/* Header & Branding */}
      <header className="border-b border-emerald-950/5 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-36 items-center sm:h-11 sm:w-44">
              <Image
                src="/images/logos.png"
                alt="Logo Bappeda Kota Dumai"
                fill
                priority
                className="object-contain object-left"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300"
            >
              <Radio className="size-3 animate-pulse text-emerald-600" />
              Sistem Aktif
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {/* Title and Intro */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-600/20 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-xs dark:bg-emerald-950/40 dark:text-emerald-300">
            <Sparkles className="size-3.5 text-emerald-600" />
            Portal Layar Digital Bappeda Dumai
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-950 sm:text-4xl dark:text-emerald-100">
            Pilih Layar Informasi
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Silakan pilih tampilan monitor atau panel operasional yang ingin dibuka. Untuk
            tampilan videotron di lobi utama, gunakan menu <strong>Layar Informasi Lobby</strong>.
          </p>
        </div>

        {/* Selection Cards with Arrow & Remote Keyboard Navigation */}
        <div className="mt-8 sm:mt-10">
          <ScreenSelector />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-emerald-950/5 bg-background/60 py-4 text-center text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Bappeda Kota Dumai. Seluruh hak cipta dilindungi.</p>
          <p className="flex items-center gap-1.5">
            <span>Sistem Informasi Layar Videotron Digital</span>
            <span>•</span>
            <span className="font-medium text-emerald-800 dark:text-emerald-400">Kota Dumai</span>
          </p>
        </div>
      </footer>
    </main>
  )
}
