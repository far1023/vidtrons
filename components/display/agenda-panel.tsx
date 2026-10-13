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
    <div className={cn("flex min-h-0 flex-col", className)}>
      <header className="flex items-center gap-2 px-[var(--pad)] pb-4 text-[length:var(--fs-badge)] font-semibold tracking-wide text-muted-foreground uppercase">
        <span className="truncate">{labels.agenda.judul}</span>
        {hasItems && (
          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[0.85em] font-bold text-white tabular-nums">
            {items!.length}
          </span>
        )}
      </header>

      <Autoscroll className="min-h-0 flex-1">
        {hasItems ? (
          <ul className="flex flex-col gap-2.5 px-[var(--pad)] pb-1">
            {items!.map((item, index) => {
              const { day, month } = dateParts(item.tanggal)
              return (
                <li
                  key={item.id ?? index}
                  className="grid grid-cols-[3.75rem_1fr] items-center gap-3 rounded-xl bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.06),0_6px_16px_-6px_rgba(16,24,40,0.12)] ring-1 ring-black/5"
                >
                  {/* Blok tanggal: tile gradient emerald */}
                  <div className="flex flex-col items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 py-2.5 leading-none text-white shadow-md shadow-emerald-600/25">
                    <span className="text-[length:calc(var(--fs-title)*1.6)] font-extrabold tracking-tight tabular-nums">
                      {day}
                    </span>
                    <span className="mt-1 text-[length:var(--fs-badge)] font-semibold tracking-wider uppercase opacity-90">
                      {month}
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-col gap-1.5">
                    <h3 className="text-[length:var(--fs-title)] leading-snug font-semibold tracking-tight text-foreground">
                      {item.judul}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[length:var(--fs-badge)] font-semibold text-emerald-700">
                        <Clock className="size-3 shrink-0" />
                        <span className="tabular-nums">
                          {formatTime(item.mulai)} – {formatTime(item.selesai)}
                        </span>
                      </span>

                      {item.lokasi ? (
                        <span className="inline-flex min-w-0 items-start gap-1.5 text-[length:var(--fs-badge)] text-muted-foreground">
                          <MapPin className="mt-0.5 size-3 shrink-0" />
                          <span className="line-clamp-2">{item.lokasi}</span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="mx-[var(--pad)] flex h-full min-h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-6 text-center text-[length:var(--fs-body)] text-muted-foreground">
            <CalendarCheck className="mb-2 size-6 text-muted-foreground/40" />
            <p>{labels.agenda.kosong}</p>
          </div>
        )}
      </Autoscroll>
    </div>
  )
}
