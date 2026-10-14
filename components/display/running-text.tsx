import { labels } from "@/lib/labels"
import { Marquee } from "@/components/display/marquee"
import { cn } from "@/lib/utils"

export type RunningTextProps = {
  items?: { id?: number; isi: string }[]
  className?: string
  /** Kecepatan gerak teks (px per detik) */
  speed?: number
}

export function RunningText({
  items,
  className,
  speed = 90,
}: RunningTextProps) {
  const messages = items?.length
    ? items.map((item) => item.isi)
    : [labels.runningText.placeholder]

  return (
    <div
      className={cn(
        "relative isolate z-10 flex min-h-0 items-stretch overflow-hidden whitespace-nowrap select-none",
        "bg-linear-to-r from-emerald-950 via-emerald-900 to-teal-900 text-[clamp(1.05rem,1.35vw,1.65rem)] font-medium text-white",
        className
      )}
      style={{ contain: "paint" }}
    >
      {/* Label tetap di kiri */}
      <div className="relative z-10 flex shrink-0 items-center gap-2.5 bg-emerald-500 px-5 sm:px-7 text-[clamp(0.9rem,1.1vw,1.35rem)] font-black tracking-widest uppercase shadow-[8px_0_16px_-4px_rgba(0,0,0,0.35)]">
        <span className="size-2.5 sm:size-3 animate-pulse rounded-full bg-white" />
        Info
      </div>

      {/*
        Setiap pesan diikuti pemisah (termasuk yang terakhir), jadi sambungan
        antar putaran terlihat sama dengan sambungan antar pesan.
      */}
      <Marquee speed={speed} className="flex-1">
        {messages.map((isi, index) => (
          <span key={index} className="flex shrink-0 items-center">
            <span>{isi}</span>
            <span className="mx-[var(--pad-x)] text-emerald-300 font-bold text-[1.1em]">
              {labels.runningText.pemisah}
            </span>
          </span>
        ))}
      </Marquee>
    </div>
  )
}
