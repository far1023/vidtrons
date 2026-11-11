"use client"

import { ArrowDown, ArrowUp, Minus } from "lucide-react"
import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  computeYDomain,
  formatAngka,
  pivotSeriByTahun,
  type IndikatorMulti,
  type PivotChartRow,
  type ResolvedRegionInfo,
  type Sentimen,
} from "@/lib/makro-ekonomi"
import { cn } from "@/lib/utils"

export { computeYDomain }

// Satu aksen warna per data: panah tren (sama dengan ticker di layar lobi)
const WARNA_SENTIMEN: Record<Sentimen, string> = {
  positif: "text-emerald-600",
  negatif: "text-rose-600",
  netral: "text-slate-400",
}

const IKON_ARAH = { naik: ArrowUp, turun: ArrowDown, tetap: Minus } as const
const TEKS_ARAH = {
  naik: "Naik",
  turun: "Turun",
  tetap: "Tidak berubah",
} as const

export type IndikatorChartCardProps = {
  indikator: IndikatorMulti
  regions: readonly ResolvedRegionInfo[]
  tahunAwal?: number
  tahunAkhir?: number
}

export function IndikatorChartCard({
  indikator,
  regions,
  tahunAwal: propTahunAwal,
  tahunAkhir: propTahunAkhir,
}: IndikatorChartCardProps) {
  const { judul, satuan, seri } = indikator
  if (seri.length === 0) return null

  const regionById = new Map(regions.map((r) => [r.id, r]))

  const allYears = seri.flatMap((s) => s.titik.map((t) => t.tahun))
  const tahunAwal = propTahunAwal ?? Math.min(...allYears)
  const tahunAkhir = propTahunAkhir ?? Math.max(...allYears)

  const config: ChartConfig = {}
  for (const s of seri) {
    const reg = regionById.get(s.regionId)
    config[`r${s.regionId}`] = {
      label: reg?.nama ?? `Wilayah ${s.regionId}`,
      color: reg?.warna ?? "#059669",
    }
  }

  const chartData = pivotSeriByTahun(seri, tahunAwal, tahunAkhir)
  const domain = computeYDomain(seri, "garis")
  const isSingleSeries = seri.length === 1
  const showPointLabels = seri.length <= 2

  const primarySeri = seri[0]
  const primaryRegion = regionById.get(primarySeri.regionId)
  const PrimaryIkon = primarySeri.delta
    ? IKON_ARAH[primarySeri.delta.arah]
    : null

  const tahunKosongSingle = isSingleSeries
    ? primarySeri.titik.filter((t) => t.nilai === null).map((t) => t.tahun)
    : []

  const tooltip = (
    <ChartTooltip
      cursor={false}
      content={({ active, payload }) => {
        if (!active || !payload?.length) return null
        const row = payload[0]?.payload as PivotChartRow | undefined
        if (!row) return null

        const activeItems = [...payload]
          .filter(
            (item) =>
              item.type !== "none" &&
              item.value !== null &&
              item.value !== undefined
          )
          .sort((a, b) => Number(b.value) - Number(a.value))

        if (activeItems.length === 0) return null

        return (
          <ChartTooltipContent
            active={active}
            payload={activeItems}
            hideIndicator={isSingleSeries}
            labelFormatter={() => `Tahun ${row.tahun}`}
            formatter={(value, name, item) => {
              const key = String(item.dataKey ?? name)
              const labelKey = `${key}_label`
              const rawLabel = row[labelKey]
              const formattedVal =
                typeof rawLabel === "string" && rawLabel
                  ? rawLabel
                  : typeof value === "number"
                    ? formatAngka(value)
                    : String(value)
              const itemCfg = config[key]
              const color = item.color ?? itemCfg?.color ?? "#059669"

              if (isSingleSeries) {
                return (
                  <span className="font-medium tabular-nums">
                    {formattedVal} {satuan}
                  </span>
                )
              }

              return (
                <div className="flex w-full items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="size-2.5 shrink-0 rounded-[2px]"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-muted-foreground">
                      {itemCfg?.label ?? name}
                    </span>
                  </div>
                  <span className="font-medium text-foreground tabular-nums">
                    {formattedVal} {satuan}
                  </span>
                </div>
              )
            }}
          />
        )
      }}
    />
  )

  const margin = { top: showPointLabels ? 24 : 12, left: 16, right: 16 }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base leading-snug">{judul}</CardTitle>
        <CardDescription>
          {isSingleSeries
            ? `${primaryRegion ? `${primaryRegion.nama} · ` : ""}Data terakhir tahun ${primarySeri.tahunTerbaru}`
            : `Perbandingan ${seri.length} wilayah (${tahunAwal}–${tahunAkhir})`}
        </CardDescription>

        {isSingleSeries ? (
          <>
            <div className="mt-2 flex items-center gap-2.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl leading-none font-black tracking-tight text-emerald-950 tabular-nums dark:text-emerald-100">
                  {primarySeri.nilaiTerbaru}
                </span>
                <span className="text-base font-bold text-emerald-800/70 dark:text-emerald-300/70">
                  {satuan}
                </span>
              </div>
              {PrimaryIkon && primarySeri.delta && (
                <PrimaryIkon
                  aria-hidden
                  className={cn(
                    "size-7 shrink-0 stroke-[3]",
                    WARNA_SENTIMEN[primarySeri.delta.sentimen]
                  )}
                />
              )}
            </div>

            {primarySeri.delta && (
              <p className="text-xs text-muted-foreground">
                {primarySeri.delta.arah === "tetap"
                  ? `Tidak berubah dibanding ${primarySeri.delta.tahunPembanding}`
                  : `${TEKS_ARAH[primarySeri.delta.arah]} ${primarySeri.delta.selisihLabel} dibanding ${primarySeri.delta.tahunPembanding}`}
              </p>
            )}
          </>
        ) : (
          <ul className="mt-2 divide-y divide-border/60 rounded-lg border border-border/60 bg-muted/20 px-3 py-1.5 text-xs">
            {seri.map((s) => {
              const reg = regionById.get(s.regionId)
              const Ikon = s.delta ? IKON_ARAH[s.delta.arah] : null
              return (
                <li
                  key={s.regionId}
                  className="flex items-center justify-between gap-2 py-1.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden
                      className="size-2.5 shrink-0 rounded-[2px]"
                      style={{ backgroundColor: reg?.warna ?? "#059669" }}
                    />
                    <span className="truncate font-medium text-foreground">
                      {reg?.nama ?? `Wilayah ${s.regionId}`}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      ({s.tahunTerbaru})
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="font-bold text-emerald-950 tabular-nums dark:text-emerald-100">
                      {s.nilaiTerbaru} {satuan}
                    </span>
                    {Ikon && s.delta && (
                      <Ikon
                        aria-label={`${TEKS_ARAH[s.delta.arah]} ${s.delta.selisihLabel}`}
                        className={cn(
                          "size-3.5 shrink-0 stroke-[2.75]",
                          WARNA_SENTIMEN[s.delta.sentimen]
                        )}
                      />
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardHeader>

      <CardContent>
        <ChartContainer
          config={config}
          className={cn(
            "aspect-auto w-full",
            isSingleSeries ? "h-52 sm:h-56" : "h-60 sm:h-64"
          )}
        >
          <LineChart data={chartData} margin={margin}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="tahun"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis hide domain={domain} />
            {tooltip}
            {!isSingleSeries && (
              <ChartLegend content={<ChartLegendContent />} />
            )}
            {seri.map((s, idx) => (
              <Line
                key={s.regionId}
                dataKey={`r${s.regionId}`}
                type="monotone"
                stroke={`var(--color-r${s.regionId})`}
                strokeWidth={2.75}
                dot={{ r: 4, fill: `var(--color-r${s.regionId})` }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              >
                {showPointLabels && idx === 0 && (
                  <LabelList
                    dataKey={`r${s.regionId}_label`}
                    position="top"
                    offset={10}
                    fontSize={12}
                    className="fill-foreground font-medium"
                  />
                )}
              </Line>
            ))}
          </LineChart>
        </ChartContainer>

        {tahunKosongSingle.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Data tahun {tahunKosongSingle.join(", ")} belum tersedia.
          </p>
        )}

        {/* Alternatif teks untuk pembaca layar: daftar per wilayah dan per tahun */}
        <div className="sr-only">
          {seri.map((s) => {
            const reg = regionById.get(s.regionId)
            return (
              <div key={s.regionId}>
                <h4>{reg?.nama ?? `Wilayah ${s.regionId}`}</h4>
                <ul>
                  {s.titik.map((t) => (
                    <li key={t.tahun}>
                      {t.tahun}:{" "}
                      {t.nilaiLabel
                        ? `${t.nilaiLabel} ${satuan}`
                        : "belum tersedia"}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
