"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export type MarqueeProps = {
  children: React.ReactNode
  /** Kecepatan gerak dalam piksel per detik (konstan, tidak bergantung panjang konten) */
  speed?: number
  /** Jarak antar item di dalam satu segmen sekaligus jarak sambungan loop (px) */
  gap?: number
  className?: string
}

/**
 * Marquee dengan loop tanpa sambungan terlihat.
 *
 * - Konten dirender dalam "segmen" yang diulang sampai menutupi lebar wadah.
 * - Track digeser tepat sebesar lebar SATU segmen (diukur nyata di browser),
 *   sehingga posisi akhir identik dengan posisi awal -> tidak ada lompatan.
 * - Durasi = lebar segmen / kecepatan, jadi laju gerak selalu konstan.
 * - Saat ukuran berubah (data baru, font selesai dimuat), animasi dilanjutkan
 *   dari progres yang sama, tidak diulang dari awal.
 */
export function Marquee({
  children,
  speed = 80,
  gap = 0,
  className,
}: MarqueeProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const trackRef = React.useRef<HTMLDivElement>(null)
  const segmentRef = React.useRef<HTMLDivElement>(null)
  const animRef = React.useRef<Animation | null>(null)
  const durationRef = React.useRef(0)

  const [containerW, setContainerW] = React.useState(0)
  const [segW, setSegW] = React.useState(0)

  // Ukur wadah & satu segmen; pantau perubahan ukuran
  React.useEffect(() => {
    const container = containerRef.current
    const segment = segmentRef.current
    if (!container || !segment) return

    const measure = () => {
      const c = container.getBoundingClientRect().width
      const s = segment.getBoundingClientRect().width
      setContainerW((prev) => (Math.abs(prev - c) < 0.5 ? prev : c))
      setSegW((prev) => (Math.abs(prev - s) < 0.01 ? prev : s))
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(container)
    ro.observe(segment)
    return () => ro.disconnect()
  }, [])

  // Jalankan / perbarui animasi tanpa mengulang dari awal
  React.useEffect(() => {
    const track = trackRef.current
    if (!track || segW <= 0 || speed <= 0) return

    const duration = (segW / speed) * 1000

    let progress = 0
    const prev = animRef.current
    if (prev && durationRef.current > 0) {
      const t = Number(prev.currentTime ?? 0)
      progress = (t % durationRef.current) / durationRef.current
      prev.cancel()
    }

    const anim = track.animate(
      [
        { transform: "translate3d(0, 0, 0)" },
        { transform: `translate3d(${-segW}px, 0, 0)` },
      ],
      { duration, iterations: Infinity, easing: "linear" }
    )
    anim.currentTime = progress * duration

    animRef.current = anim
    durationRef.current = duration
  }, [segW, speed])

  React.useEffect(() => {
    return () => {
      animRef.current?.cancel()
      animRef.current = null
    }
  }, [])

  // Cukup banyak salinan agar track selalu lebih panjang dari wadah + 1 segmen
  const copies =
    segW > 0 && containerW > 0
      ? Math.max(2, Math.ceil(containerW / segW) + 1)
      : 2

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex min-w-0 items-center overflow-hidden",
        className
      )}
    >
      <div
        ref={trackRef}
        className="flex w-max shrink-0 items-center will-change-transform"
      >
        {Array.from({ length: copies }, (_, i) => (
          <div
            key={i}
            ref={i === 0 ? segmentRef : undefined}
            aria-hidden={i > 0 || undefined}
            className="flex shrink-0 items-center"
            style={{ gap, paddingRight: gap }}
          >
            {children}
          </div>
        ))}
      </div>
    </div>
  )
}
