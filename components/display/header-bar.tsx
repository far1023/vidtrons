"use client"

import { useClock } from "@/hooks/use-clock"
import { labels } from "@/lib/labels"
import { cn } from "@/lib/utils"

export type HeaderBarProps = {
  nama?: string
  slogan?: string
  logoUrl?: string | null
  className?: string
}

export function HeaderBar({
  logoUrl = "/images/logos.png",
  className,
}: HeaderBarProps) {
  const currentLogo = logoUrl || "/images/logos.png"
  const clock = useClock()

  return (
    <header
      className={cn(
        "relative isolate flex min-h-0 items-center justify-between gap-[var(--gap)]",
        "px-10 text-[var(--c-text)]",
        className
      )}
    >
      <div className="flex h-[45%] shrink-0 items-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentLogo}
          alt={labels.header.logo}
          className="h-full max-h-full w-auto object-contain"
        />
      </div>

      {/* Pill status "live" + tanggal */}
      <div className="flex items-center gap-3.5 rounded-full bg-white/85 px-6 py-2.5 shadow-sm ring-1 ring-black/5">
        <span className="relative flex size-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60" />
          <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
        </span>
        <span
          suppressHydrationWarning
          className="text-[clamp(1rem,1.35vw,1.65rem)] font-bold tracking-wide text-emerald-900 uppercase"
        >
          {clock.day}, {clock.date}
        </span>
      </div>
    </header>
  )
}
