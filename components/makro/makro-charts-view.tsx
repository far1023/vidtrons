"use client"

import { useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { IndikatorChartCard } from "@/components/makro/indikator-chart-card"
import { RegionFilter } from "@/components/makro/region-filter"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useMakroData } from "@/hooks/use-makro-data"
import {
  DEFAULT_WILAYAH_KODE,
  formatWilayahQueryParam,
  resolveRegionsFromWilayahParam,
  type GrafikMakroMulti,
  type RegionInfo,
} from "@/lib/makro-ekonomi"

export type MakroChartsViewProps = {
  initialData?: GrafikMakroMulti | null
  availableRegions: readonly RegionInfo[]
  initialWilayahParam?: string | null
  defaultKode?: string
}

export function MakroChartsView({
  initialData,
  availableRegions,
  initialWilayahParam,
  defaultKode = DEFAULT_WILAYAH_KODE,
}: MakroChartsViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const rawWilayah = searchParams?.get("wilayah") ?? initialWilayahParam ?? null

  const selectedRegions = useMemo(
    () =>
      resolveRegionsFromWilayahParam(
        rawWilayah,
        availableRegions,
        defaultKode
      ),
    [rawWilayah, availableRegions, defaultKode]
  )

  const selectedKodes = useMemo(
    () => selectedRegions.map((r) => r.kode),
    [selectedRegions]
  )

  const selectedRegionIds = useMemo(
    () => selectedRegions.map((r) => r.id),
    [selectedRegions]
  )

  // Only pass initialData as SWR fallback when the active selection matches initialData's regions
  const matchesInitial = useMemo(() => {
    if (!initialData) return false
    if (initialData.regions.length !== selectedRegionIds.length) return false
    return initialData.regions.every(
      (r, idx) => r.id === selectedRegionIds[idx]
    )
  }, [initialData, selectedRegionIds])

  const [isManualRefreshing, setIsManualRefreshing] = useState(false)

  const { data, isLoading, isValidating, error, refresh } = useMakroData({
    regionIds: selectedRegionIds,
    fallbackData: matchesInitial ? initialData : undefined,
  })

  async function handleRefresh() {
    setIsManualRefreshing(true)
    try {
      await refresh()
      router.refresh()
    } finally {
      setIsManualRefreshing(false)
    }
  }

  function handleChangeKodes(nextKodes: string[]) {
    const params = new URLSearchParams(searchParams?.toString() ?? "")
    const formatted = formatWilayahQueryParam(nextKodes, defaultKode)
    if (formatted) {
      params.set("wilayah", formatted)
    } else {
      params.delete("wilayah")
    }
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  return (
    <div>
      {availableRegions.length > 0 && (
        <RegionFilter
          regions={availableRegions}
          selectedKodes={selectedKodes}
          onChange={handleChangeKodes}
          defaultKode={defaultKode}
          onRefresh={() => void handleRefresh()}
          isRefreshing={isManualRefreshing || isValidating}
        />
      )}

      {isLoading ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-6 grid gap-4 sm:mt-8 md:grid-cols-2 xl:grid-cols-3"
        >
          <span className="sr-only">Memuat data grafik makro ekonomi...</span>
          {Array.from({ length: 6 }, (_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="flex h-80 flex-col justify-between py-6">
                <div className="space-y-2">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                  <div className="mt-4 h-9 w-28 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-44 w-full animate-pulse rounded bg-muted/60" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error && !data ? (
        <Card className="mx-auto mt-6 max-w-md sm:mt-8">
          <CardContent className="space-y-3 py-8 text-center text-sm">
            <p className="font-medium text-foreground">
              Gagal memuat data grafik makro ekonomi dari server.
            </p>
            <p className="text-xs text-muted-foreground">
              Periksa koneksi jaringan Anda lalu coba muat ulang.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refresh()}
            >
              Muat ulang data
            </Button>
          </CardContent>
        </Card>
      ) : !data || data.indikator.length === 0 ? (
        <Card className="mx-auto mt-6 max-w-md sm:mt-8">
          <CardContent className="space-y-1.5 py-10 text-center text-sm">
            <p className="font-medium text-foreground">
              Data makro ekonomi belum tersedia untuk wilayah yang dipilih.
            </p>
            <p className="text-xs text-muted-foreground">
              Tambahkan data indikator di panel admin Makro Ekonomi atau pilih
              wilayah lain pada filter di atas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 sm:mt-8 md:grid-cols-2 xl:grid-cols-3">
          {data.indikator.map((item) => (
            <IndikatorChartCard
              key={item.judul}
              indikator={item}
              regions={data.regions}
              tahunAwal={data.tahunAwal}
              tahunAkhir={data.tahunAkhir}
            />
          ))}
        </div>
      )}
    </div>
  )
}
