import { Autoscroll } from "@/components/display/autoscroll"
import { CalendarCheck, Clock, MapPin } from "lucide-react"
import { labels } from "@/lib/labels"
import { cn } from "@/lib/utils"

export type AgendaItem = {
  id?: number
  judul: string
  mulai: string
  selesai: string
  lokasi: string
  tanggal?: string
}

export type AgendaPanelProps = {
  items?: AgendaItem[]
  className?: string
}

const TZ = "Asia/Jakarta"

function formatTime(timeStr: string): string {
  // Handles HH:mm:ss or HH:mm
  return timeStr ? timeStr.slice(0, 5) : "--:--"
}

/** Tanggal (angka) + bulan singkat untuk blok tanggal. Tanpa `tanggal` = hari ini (WIB). */
function dateParts(tanggal?: string): { day: string; month: string } {
  const m = tanggal?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const date = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : new Date()
  const timeZone = m ? "UTC" : TZ
  return {
    day: new Intl.DateTimeFormat("id-ID", { day: "numeric", timeZone }).format(
      date
    ),
    month: new Intl.DateTimeFormat("id-ID", {
      month: "short",
      timeZone,
    }).format(date),
  }
}

/**
 * Isi kartu agenda (child). Card parent disediakan oleh DisplayScreen,
 * jadi komponen ini hanya merender header + daftar agenda.
 */
export function AgendaPanel({ items, className }: AgendaPanelProps) {
  const hasItems = Boolean(items && items.length > 0)

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden",
        className
      )}
    >
      <header className="flex min-w-0 items-center gap-2 px-[var(--pad)] pb-3 text-[clamp(0.8rem,1vw,1.15rem)] font-bold tracking-wide text-muted-foreground uppercase sm:pb-4">
        <span className="truncate">{labels.agenda.judul}</span>
        {hasItems && (
          <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[0.85em] font-bold text-white tabular-nums sm:px-2.5">
            {items!.length}
          </span>
        )}
      </header>

      <Autoscroll className="min-h-0 w-full min-w-0 flex-1 overflow-x-hidden">
        {hasItems ? (
          <ul className="flex w-full min-w-0 flex-col gap-2.5 px-[var(--pad)] pb-1 sm:gap-3">
            {items!.map((item, index) => {
              const { day, month } = dateParts(item.tanggal)
              return (
                <li
                  key={item.id ?? index}
                  className="grid w-full min-w-0 grid-cols-[clamp(2.75rem,3.2vw,4.5rem)_minmax(0,1fr)] items-start gap-2.5 overflow-hidden rounded-xl bg-white p-2.5 shadow-[0_1px_3px_rgba(16,24,40,0.08),0_8px_20px_-6px_rgba(16,24,40,0.14)] ring-1 ring-black/5 sm:gap-3 sm:p-3.5"
                >
                  {/* Blok tanggal: tile gradient emerald stick to top */}
                  <div className="flex w-full min-w-0 shrink-0 flex-col items-center justify-center self-start rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 px-1 py-2 leading-none text-white shadow-md shadow-emerald-600/25 sm:py-2.5">
                    <span className="text-[clamp(1.2rem,1.75vw,2.25rem)] font-black tracking-tight tabular-nums">
                      {day}
                    </span>
                    <span className="mt-1 text-[clamp(0.65rem,0.8vw,0.95rem)] font-bold tracking-wider uppercase opacity-95">
                      {month}
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-col gap-1.5 sm:gap-2">
                    <h3 className="line-clamp-3 text-[clamp(1.05rem,1.35vw,1.4rem)] leading-snug tracking-tight [overflow-wrap:anywhere] break-words text-foreground">
                      {item.judul}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 sm:gap-x-3 sm:gap-y-1.5">
                      <span className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[clamp(0.7rem,0.85vw,1rem)] font-bold text-emerald-800 ring-1 ring-emerald-200 sm:gap-1.5 sm:px-2.5 sm:py-1">
                        <Clock className="size-3 shrink-0 text-emerald-600 sm:size-3.5" />
                        <span className="truncate tabular-nums">
                          {formatTime(item.mulai)} – {formatTime(item.selesai)}
                        </span>
                      </span>

                      {item.lokasi ? (
                        <span className="inline-flex max-w-full min-w-0 items-start gap-1 text-[clamp(0.7rem,0.85vw,1rem)] font-medium text-muted-foreground sm:gap-1.5">
                          <MapPin className="mt-0.5 size-3 shrink-0 text-emerald-700/80 sm:size-3.5" />
                          <span className="line-clamp-2 [overflow-wrap:anywhere] break-words">
                            {item.lokasi}
                          </span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="mx-[var(--pad)] flex h-full min-h-[100px] flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-4 text-center text-[length:var(--fs-body)] text-muted-foreground sm:p-6">
            <CalendarCheck className="mb-2 size-5 text-muted-foreground/40 sm:size-6" />
            <p className="line-clamp-2">{labels.agenda.kosong}</p>
          </div>
        )}
      </Autoscroll>
    </div>
  )
}
