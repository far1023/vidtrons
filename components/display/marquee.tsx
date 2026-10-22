"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export type MarqueeProps = {
  children: React.ReactNode
  /** Movement speed in pixels per second (constant, independent of content length) */
  speed?: number
  /** Spacing between items within a segment, also the loop seam spacing (px) */
  gap?: number
  className?: string
}

/**
 * Marquee with a loop that has no visible seam.
 *
 * - Content is rendered in "segments" repeated until they cover the container width.
 * - The track is shifted by exactly the width of ONE segment (measured in the browser),
 *   so the end position is identical to the start position -> no jump.
 * - Duration = segment width / speed, so the movement rate is always constant.
 * - When the size changes (new data, fonts finished loading), the animation continues
 *   from the same progress instead of restarting.
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

  // Start / update the animation without restarting from the beginning
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

  // Enough copies so the track is always longer than the container + 1 segment
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
