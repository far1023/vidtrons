import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, TrendingUp } from "lucide-react"

import { LobbyBackground } from "@/components/display/lobby-background"
import { IndikatorChartCard } from "@/components/makro/indikator-chart-card"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getGrafikMakroEkonomi } from "@/server/services/grafik-makro-ekonomi.service"

export const metadata: Metadata = {
  title: "Grafik Makro Ekonomi - Bappeda Kota Dumai",
  description:
    "Perkembangan indikator utama pembangunan Kota Dumai selama lima tahun terakhir dalam bentuk grafik.",
}

// Data tetap di-cache lewat unstable_cache; halaman tidak diprerender saat build
export const dynamic = "force-dynamic"

export default async function GrafikMakroEkonomiPage() {
  const data = await getGrafikMakroEkonomi()
  const indikator = data?.indikator ?? []

  return (
    <main className="relative isolate flex min-h-screen flex-col overflow-x-hidden bg-[#fff9f4] text-[var(--c-text)] antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Background SVG Gradient dari halaman lobby */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        role="img"
        aria-label="Lobby background"
      >
        <LobbyBackground className="h-full w-full" />
      </div>

      <header className="border-b border-emerald-950/5 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="relative h-10 w-36 sm:h-11 sm:w-44">
            <Image
              src="/images/logos.png"
              alt="Logo Bappeda Kota Dumai"
              fill
              priority
              className="object-contain object-left"
            />
          </div>

          {/* Ubah href jika portal pemilihan layar ada di rute lain */}
          <Link
            href="/"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowLeft className="size-4" />
            Portal
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-600/20 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-xs dark:bg-emerald-950/40 dark:text-emerald-300">
            <TrendingUp className="size-3.5 text-emerald-600" />
            Indikator Pembangunan
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-950 sm:text-4xl dark:text-emerald-100">
            Grafik Makro Ekonomi Kota Dumai
          </h1>
          {data && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Perkembangan {indikator.length} indikator utama pembangunan, tahun{" "}
              {data.tahunAwal} sampai {data.tahunAkhir}.
            </p>
          )}
        </div>

        {indikator.length > 0 ? (
          <div className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-2 xl:grid-cols-3">
            {indikator.map((item) => (
              <IndikatorChartCard key={item.judul} indikator={item} />
            ))}
          </div>
        ) : (
          <Card className="mx-auto mt-8 max-w-md sm:mt-10">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Data makro ekonomi belum tersedia.
            </CardContent>
          </Card>
        )}
      </div>

      <footer className="border-t border-emerald-950/5 bg-background/60 py-4 text-center text-xs text-muted-foreground">
        <p className="mx-auto max-w-6xl px-4 sm:px-6">
          Sumber data: BPS dan Bappeda Kota Dumai. © {new Date().getFullYear()}{" "}
          Bappeda Kota Dumai.
        </p>
      </footer>
    </main>
  )
}
