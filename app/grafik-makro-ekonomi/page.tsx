import { Suspense } from "react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, TrendingUp } from "lucide-react"

import { LobbyBackground } from "@/components/display/lobby-background"
import { MakroChartsView } from "@/components/makro/makro-charts-view"
import { buttonVariants } from "@/components/ui/button"
import {
  DEFAULT_WILAYAH_KODE,
  resolveRegionsFromWilayahParam,
} from "@/lib/makro-ekonomi"
import { getGrafikMakroMulti } from "@/server/services/grafik-makro-ekonomi.service"
import { getActiveRegions } from "@/server/services/region.service"

export const metadata: Metadata = {
  title: "Grafik Makro Ekonomi - Bappeda Kota Dumai",
  description:
    "Perkembangan indikator utama pembangunan Kota Dumai dan wilayah pembanding selama lima tahun terakhir dalam bentuk grafik.",
}

// Data is still cached via unstable_cache; the page is not prerendered at build time
export const dynamic = "force-dynamic"

type PageProps = {
  searchParams?: Promise<{ wilayah?: string | string[] }>
}

export default async function GrafikMakroEkonomiPage({
  searchParams,
}: PageProps) {
  const resolvedParams = searchParams ? await searchParams : {}
  const rawWilayah = Array.isArray(resolvedParams.wilayah)
    ? resolvedParams.wilayah.join(",")
    : (resolvedParams.wilayah ?? null)

  const activeRegions = await getActiveRegions()
  const selectedRegions = resolveRegionsFromWilayahParam(
    rawWilayah,
    activeRegions,
    DEFAULT_WILAYAH_KODE
  )
  const regionIds = selectedRegions.map((r) => r.id)

  const data = await getGrafikMakroMulti({ regionIds })
  const indikator = data?.indikator ?? []

  return (
    <main className="relative isolate flex min-h-screen flex-col overflow-x-hidden bg-[#fff9f4] text-[var(--c-text)] antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Background SVG gradient from the lobby page */}
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

        <Suspense fallback={null}>
          <MakroChartsView
            initialData={data}
            availableRegions={activeRegions}
            initialWilayahParam={rawWilayah}
          />
        </Suspense>
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
