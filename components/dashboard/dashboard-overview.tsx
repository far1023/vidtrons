"use client"

import Link from "next/link"
import useSWR from "swr"
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CalendarX2,
  ExternalLink,
  Film,
  ImageIcon,
  Megaphone,
  MapPin,
  MessageSquareText,
  MonitorPlay,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"
import type { ContentStat, DashboardOverview } from "@/types/dashboard"

const fetcher = async (url: string): Promise<DashboardOverview> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Gagal memuat data dashboard")
  const json = await res.json()
  return json.data
}

type StatKey = keyof DashboardOverview["stats"]

const STAT_CARDS: Array<{
  key: StatKey
  label: string
  href: string
  icon: LucideIcon
  /** Shown in the warning when nothing is active for this content type. */
  emptyHint?: string
}> = [
  { key: "pengumuman", label: "Pengumuman", href: "/pengumuman", icon: Megaphone },
  { key: "agenda", label: "Agenda Kegiatan", href: "/agenda", icon: Calendar },
  {
    key: "runningText",
    label: "Teks Berjalan",
    href: "/running-texts",
    icon: MessageSquareText,
    emptyHint: "Layar menampilkan teks bawaan",
  },
  {
    key: "promo",
    label: "Promo & Spanduk",
    href: "/promo",
    icon: ImageIcon,
    emptyHint: "Panel promo menampilkan gambar kosong",
  },
  {
    key: "video",
    label: "Daftar Video",
    href: "/video",
    icon: Film,
    emptyHint: "Panel video tidak memutar apa pun",
  },
  {
    key: "makroEkonomi",
    label: "Makro Ekonomi",
    href: "/makro-ekonomi",
    icon: TrendingUp,
    emptyHint: "Panel makro ekonomi menampilkan data contoh",
  },
]

/** Parse a YYYY-MM-DD string as a plain calendar date (no timezone shift). */
function parseDate(value: string) {
  return new Date(`${value}T00:00:00Z`)
}

function formatDate(value: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", ...options }).format(
    parseDate(value)
  )
}

function relativeDayLabel(value: string, today: string) {
  const diff = Math.round(
    (parseDate(value).getTime() - parseDate(today).getTime()) / 86_400_000
  )
  if (diff === 0) return "Hari ini"
  if (diff === 1) return "Besok"
  return formatDate(value, { weekday: "short", day: "numeric", month: "short" })
}

function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Jakarta",
    }).format(new Date())
  )
  if (hour < 11) return "Selamat pagi"
  if (hour < 15) return "Selamat siang"
  if (hour < 18) return "Selamat sore"
  return "Selamat malam"
}

export function DashboardOverviewPanel() {
  const { user } = useAuth()
  const { data, error, isLoading, mutate } = useSWR(
    "/api/admin/dashboard",
    fetcher,
    { refreshInterval: 60_000, revalidateOnFocus: true }
  )

  const emptyContent = data
    ? STAT_CARDS.filter(
        (card) => card.emptyHint && data.stats[card.key].active === 0
      )
    : []

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Greeting */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {data
              ? formatDate(data.today, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "\u00a0"}
          </p>
          <h2 className="text-2xl font-bold tracking-tight">
            {greeting()}, {user?.email ?? "Admin"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Ringkasan konten yang sedang tayang di layar informasi lobby.
          </p>
        </div>
        <Link
          href="/lobby"
          target="_blank"
          rel="noopener"
          className={cn(
            buttonVariants({ variant: "default" }),
            "bg-emerald-600 text-white hover:bg-emerald-700"
          )}
        >
          <MonitorPlay />
          Buka layar lobby
          <ExternalLink className="size-3.5" />
        </Link>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <span>Data dashboard tidak dapat dimuat.</span>
          <button
            type="button"
            onClick={() => mutate()}
            className="font-medium underline underline-offset-4"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* Attention: content types with nothing active */}
      {emptyContent.length > 0 && (
        <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div className="space-y-1">
            <p className="font-medium">Perlu perhatian</p>
            <ul className="list-disc space-y-0.5 pl-4 text-amber-900/90">
              {emptyContent.map((card) => (
                <li key={card.key}>
                  <Link
                    href={card.href}
                    className="font-medium underline underline-offset-4"
                  >
                    {card.label}
                  </Link>{" "}
                  belum ada yang aktif. {card.emptyHint}.
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            href={card.href}
            icon={card.icon}
            stat={data?.stats[card.key]}
            isLoading={isLoading}
          />
        ))}
        <StatCard
          label="Pengguna"
          href="/pengguna"
          icon={Users}
          stat={
            data
              ? { total: data.totalPengguna, active: data.totalPengguna }
              : undefined
          }
          isLoading={isLoading}
          activeNoun="akun"
        />
      </div>

      {/* Lists */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Agenda mendatang</CardTitle>
            <CardDescription>
              Kegiatan aktif mulai hari ini yang akan tampil di layar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ListSkeleton />
            ) : data && data.agendaMendatang.length > 0 ? (
              <ul className="divide-y">
                {data.agendaMendatang.map((item) => (
                  <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-800">
                      <span className="text-lg leading-none font-bold">
                        {formatDate(item.tanggal, { day: "numeric" })}
                      </span>
                      <span className="text-[10px] font-medium uppercase">
                        {formatDate(item.tanggal, { month: "short" })}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium">{item.judul}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          {relativeDayLabel(item.tanggal, data.today)}, {item.mulai}
                          {" - "}
                          {item.selesai}
                        </span>
                        <span className="flex min-w-0 items-center gap-1">
                          <MapPin className="size-3 shrink-0" />
                          <span className="truncate">{item.lokasi}</span>
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={CalendarX2}
                text="Belum ada agenda mendatang."
                href="/agenda"
                action="Tambah agenda"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pengumuman terbaru</CardTitle>
            <CardDescription>
              Pengumuman aktif dengan tanggal paling baru.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ListSkeleton />
            ) : data && data.pengumumanTerbaru.length > 0 ? (
              <ul className="divide-y">
                {data.pengumumanTerbaru.map((item) => (
                  <li key={item.id} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
                    <p className="line-clamp-2 text-sm font-medium">{item.judul}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {formatDate(item.tanggal, {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      {item.kategori && (
                        <Badge
                          variant="outline"
                          className="gap-1.5 font-normal"
                        >
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: item.kategori.warna }}
                          />
                          {item.kategori.nama}
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Megaphone}
                text="Belum ada pengumuman aktif."
                href="/pengumuman"
                action="Tambah pengumuman"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  label,
  href,
  icon: Icon,
  stat,
  isLoading,
  activeNoun = "aktif",
}: {
  label: string
  href: string
  icon: LucideIcon
  stat?: ContentStat
  isLoading: boolean
  activeNoun?: string
}) {
  const percent =
    stat && stat.total > 0 ? Math.round((stat.active / stat.total) * 100) : 0
  const isEmpty = !!stat && stat.active === 0

  return (
    <Link href={href} className="group block rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
      <Card className="h-full transition-shadow group-hover:shadow-md">
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-xl",
                isEmpty
                  ? "bg-amber-500/15 text-amber-700"
                  : "bg-emerald-600/10 text-emerald-700"
              )}
            >
              <Icon className="size-5" />
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>

          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {isLoading || !stat ? (
              <Skeleton className="mt-1 h-9 w-16" />
            ) : (
              <p className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold tracking-tight tabular-nums">
                  {stat.active}
                </span>
                <span className="text-sm text-muted-foreground">
                  {activeNoun}
                  {stat.total !== stat.active && ` dari ${stat.total}`}
                </span>
              </p>
            )}
          </div>

          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted"
            role="presentation"
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isEmpty ? "bg-amber-500" : "bg-emerald-600"
              )}
              style={{ width: `${isLoading ? 0 : percent}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="size-12 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({
  icon: Icon,
  text,
  href,
  action,
}: {
  icon: LucideIcon
  text: string
  href: string
  action: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <Icon className="size-8 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">{text}</p>
      <Link
        href={href}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        {action}
      </Link>
    </div>
  )
}
