"use client"

import { ArrowDown, ArrowUp, Minus } from "lucide-react"
import {
  Bar,
  BarChart,
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
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { Indikator, Sentimen, TitikData } from "@/lib/makro-ekonomi"
import { cn } from "@/lib/utils"

const CHART_COLOR = "#059669" // emerald-600

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

export function IndikatorChartCard({ indikator }: { indikator: Indikator }) {
  const { judul, satuan, titik, delta, jenisGrafik } = indikator

  const config = {
    nilai: { label: judul, color: CHART_COLOR },
  } satisfies ChartConfig

  const nilai = titik.flatMap((t) => (t.nilai === null ? [] : [t.nilai]))
  const min = Math.min(...nilai)
  const max = Math.max(...nilai)

  // Domain sumbu Y (sumbu disembunyikan; angka tampil sebagai label di titik)
  let domain: [number, number]
  if (jenisGrafik === "batang") {
    domain = [min < 0 ? min * 1.2 : 0, max > 0 ? max * 1.2 : 0]
    if (domain[0] === 0 && domain[1] === 0) domain = [0, 1]
  } else {
    const span = max - min || Math.abs(max) * 0.2 || 1
    domain = [min - span * 0.4, max + span * 0.5]
  }

  const tahunKosong = titik.filter((t) => t.nilai === null).map((t) => t.tahun)
  const Ikon = delta ? IKON_ARAH[delta.arah] : null

  const tooltip = (
    <ChartTooltip
      cursor={false}
      content={
        <ChartTooltipContent
          hideIndicator
          labelFormatter={(_, payload) => {
            const p = payload?.[0]?.payload as TitikData | undefined
            return p ? `Tahun ${p.tahun}` : ""
          }}
          formatter={(_value, _name, item) => {
            const p = item.payload as TitikData
            return (
              <span className="font-medium tabular-nums">
                {p.nilaiLabel} {satuan}
              </span>
            )
          }}
        />
      }
    />
  )

  const label = (
    <LabelList
      dataKey="nilaiLabel"
      position="top"
      offset={10}
      fontSize={12}
      className="fill-foreground font-medium"
    />
  )

  const margin = { top: 24, left: 16, right: 16 }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base leading-snug">{judul}</CardTitle>
        <CardDescription>
          Data terakhir tahun {indikator.tahunTerbaru}
        </CardDescription>

        <div className="mt-2 flex items-center gap-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl leading-none font-black tracking-tight text-emerald-950 tabular-nums dark:text-emerald-100">
              {indikator.nilaiTerbaru}
            </span>
            <span className="text-base font-bold text-emerald-800/70 dark:text-emerald-300/70">
              {satuan}
            </span>
          </div>
          {Ikon && delta && (
            <Ikon
              aria-hidden
              className={cn(
                "size-7 shrink-0 stroke-[3]",
                WARNA_SENTIMEN[delta.sentimen]
              )}
            />
          )}
        </div>

        {delta && (
          <p className="text-xs text-muted-foreground">
            {delta.arah === "tetap"
              ? `Tidak berubah dibanding ${delta.tahunPembanding}`
              : `${TEKS_ARAH[delta.arah]} ${delta.selisihLabel} dibanding ${delta.tahunPembanding}`}
          </p>
        )}
      </CardHeader>

      <CardContent>
        <ChartContainer
          config={config}
          className="aspect-auto h-52 w-full sm:h-56"
        >
          {jenisGrafik === "batang" ? (
            <BarChart data={titik} margin={margin}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="tahun"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis hide domain={domain} />
              {tooltip}
              <Bar dataKey="nilai" fill="var(--color-nilai)" radius={6}>
                {label}
              </Bar>
            </BarChart>
          ) : (
            <LineChart data={titik} margin={margin}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="tahun"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis hide domain={domain} />
              {tooltip}
              <Line
                dataKey="nilai"
                type="monotone"
                stroke="var(--color-nilai)"
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--color-nilai)" }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              >
                {label}
              </Line>
            </LineChart>
          )}
        </ChartContainer>

        {tahunKosong.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Data tahun {tahunKosong.join(", ")} belum tersedia.
          </p>
        )}

        {/* Alternatif teks untuk pembaca layar */}
        <ul className="sr-only">
          {titik.map((t) => (
            <li key={t.tahun}>
              {t.tahun}:{" "}
              {t.nilaiLabel ? `${t.nilaiLabel} ${satuan}` : "belum tersedia"}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
