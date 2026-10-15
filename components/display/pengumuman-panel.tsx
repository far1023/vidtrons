import { Autoscroll } from "@/components/display/autoscroll"
import { Calendar, FileText } from "lucide-react"
import { labels } from "@/lib/labels"
import { cn } from "@/lib/utils"

export type PengumumanItem = {
  id?: number
  judul: string
  tanggal: string
  kategori?: { nama?: string; warna: string } | null
}

export type PengumumanPanelProps = {
  items?: PengumumanItem[]
  className?: string
}

const DEFAULT_COLOR = "#047857"

function formatDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number)
    if (!year || !month || !day) return dateStr
    const date = new Date(Date.UTC(year, month - 1, day))
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(date)
  } catch {
    return dateStr
  }
}

/** Pilih teks putih/gelap supaya label tetap terbaca di atas warna kategori apa pun. */
function contrastText(hex: string): string {
  let h = hex.replace("#", "")
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("")
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return "#ffffff"
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? "#172b4d" : "#ffffff"
}

/**
 * Isi kolom (child). Card parent disediakan oleh DisplayScreen.
 * Kartu pengumuman: putih bersih, label kategori berbentuk pill berwarna.
 */
export function PengumumanPanel({ items, className }: PengumumanPanelProps) {
  const hasItems = Boolean(items && items.length > 0)

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <header className="flex items-center gap-2 px-1 pb-4 text-[clamp(0.85rem,1.05vw,1.2rem)] font-bold tracking-wide text-muted-foreground uppercase">
        <span className="truncate">{labels.pengumuman.judul}</span>
        {hasItems && (
          <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[0.9em] font-bold text-white tabular-nums">
            {items!.length}
          </span>
        )}
      </header>

      <Autoscroll className="min-h-0 flex-1">
        {hasItems ? (
          <div className="flex flex-col gap-3 pb-1">
            {items!.map((item, index) => {
              const warna = item.kategori?.warna || DEFAULT_COLOR
              const teks = contrastText(warna)
              return (
                <article
                  key={item.id ?? index}
                  className="flex flex-col gap-3.5 rounded-xl bg-white p-4 shadow-[0_1px_3px_rgba(16,24,40,0.08),0_8px_20px_-6px_rgba(16,24,40,0.14)] ring-1 ring-black/5 sm:p-4.5"
                >
                  <h3 className="min-w-0 text-[clamp(1.05rem,1.35vw,1.4rem)] leading-snug tracking-tight [overflow-wrap:anywhere] break-words text-foreground">
                    {item.judul}
                  </h3>

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span
                      className="inline-flex max-w-[60%] min-w-0 items-center rounded-full px-3 py-1 text-[clamp(0.8rem,0.95vw,1rem)] font-bold"
                      style={{ backgroundColor: warna, color: teks }}
                    >
                      <span className="truncate">
                        {item.kategori?.nama ?? "Umum"}
                      </span>
                    </span>

                    <span className="inline-flex shrink-0 items-center gap-2 text-[clamp(0.8rem,0.95vw,1.15rem)] font-medium text-muted-foreground">
                      <Calendar className="size-3.5 shrink-0 text-emerald-700/80 sm:size-4" />
                      <span className="tabular-nums">
                        {formatDate(item.tanggal)}
                      </span>
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="flex h-full min-h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-white/60 p-6 text-center text-[length:var(--fs-body)] text-muted-foreground">
            <FileText className="mb-2 size-6 text-muted-foreground/40" />
            <p>Belum ada pengumuman aktif saat ini.</p>
          </div>
        )}
      </Autoscroll>
    </div>
  )
}
