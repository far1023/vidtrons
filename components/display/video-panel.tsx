"use client"

import { useCallback, useEffect, useReducer, useRef, useState } from "react"
import { Panel } from "@/components/display/panel"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { labels } from "@/lib/labels"
import { cn } from "@/lib/utils"

export type VideoItem = {
  id?: number
  judul?: string
  url: string
  urutan?: number
}

export type VideoPanelProps = {
  playlist?: VideoItem[]
  src?: string
  className?: string
  /** "cover" memenuhi panel (bisa memotong tepi), "contain" menampilkan utuh */
  fit?: "cover" | "contain"
}

/** Video yang gagal dilewati selama jeda ini, lalu dicoba lagi otomatis. */
const FAILED_COOLDOWN_MS = 30_000
/** Batas menunggu video mulai dimuat sebelum dianggap gagal. */
const LOAD_TIMEOUT_MS = 20_000
/** Batas video macet (buffering) tanpa kemajuan sebelum dilewati. */
const STALL_TIMEOUT_MS = 15_000
/** Saat semua video gagal, cek ulang setiap interval ini. */
const EMPTY_RETRY_MS = 5_000

export function VideoPanel({
  playlist,
  src,
  className,
  fit = "cover",
}: VideoPanelProps) {
  const items: VideoItem[] = (
    playlist?.length
      ? playlist
      : src
        ? [{ url: src, judul: labels.video.judul }]
        : []
  ).filter((item) => item.url)

  // Playlist tidak pernah dipotong saat ada video gagal; kegagalan dicatat
  // per URL beserta waktunya, dan posisi diikuti lewat URL (bukan indeks).
  const failedRef = useRef<Record<string, number>>({})
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [, rerender] = useReducer((n: number) => n + 1, 0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isPlayable = (url: string) => {
    const failedAt = failedRef.current[url]
    return failedAt === undefined || Date.now() - failedAt > FAILED_COOLDOWN_MS
  }

  /** Video berikutnya yang bisa diputar setelah `fromUrl` (bisa dirinya sendiri). */
  const pickNext = (fromUrl: string | null): string | null => {
    if (items.length === 0) return null
    const start = fromUrl ? items.findIndex((i) => i.url === fromUrl) : -1
    for (let step = 1; step <= items.length; step++) {
      const candidate = items[(start + step + items.length) % items.length]
      if (isPlayable(candidate.url)) return candidate.url
    }
    return null
  }

  const activeUrl =
    currentUrl &&
    items.some((i) => i.url === currentUrl) &&
    isPlayable(currentUrl)
      ? currentUrl
      : pickNext(null)
  const activeVideo = activeUrl
    ? (items.find((i) => i.url === activeUrl) ?? null)
    : null

  const nextUrl = activeUrl ? pickNext(activeUrl) : null
  const preloadUrl = nextUrl && nextUrl !== activeUrl ? nextUrl : null
  const isSingle = !preloadUrl

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const fail = (url: string) => {
    clearTimer()
    console.warn("Video dilewati (gagal/macet):", url)
    failedRef.current[url] = Date.now()
    setCurrentUrl(pickNext(url))
    rerender()
  }

  // Timer memanggil versi terbaru `fail` agar tidak memakai data usang
  const failRef = useRef(fail)
  failRef.current = fail

  const armTimer = (url: string, ms: number) => {
    clearTimer()
    timerRef.current = setTimeout(() => failRef.current(url), ms)
  }

  // Bersihkan timer saat berganti video atau komponen dilepas
  useEffect(() => clearTimer, [activeUrl, clearTimer])

  // Koneksi pulih: coba lagi semua video yang sempat gagal
  useEffect(() => {
    const handleOnline = () => {
      failedRef.current = {}
      rerender()
    }
    window.addEventListener("online", handleOnline)
    return () => window.removeEventListener("online", handleOnline)
  }, [])

  // Tab/layar kembali aktif: pastikan video lanjut berputar
  useEffect(() => {
    const handleVisible = () => {
      if (!document.hidden) void videoRef.current?.play()?.catch(() => {})
    }
    document.addEventListener("visibilitychange", handleVisible)
    return () => document.removeEventListener("visibilitychange", handleVisible)
  }, [])

  // Semua video sedang gagal: cek ulang berkala sampai ada yang bisa diputar
  useEffect(() => {
    if (items.length === 0 || activeVideo) return
    const timer = setTimeout(rerender, EMPTY_RETRY_MS)
    return () => clearTimeout(timer)
  })

  function handleEnded() {
    if (!activeUrl) return
    const next = pickNext(activeUrl)
    if (next && next !== activeUrl) {
      setCurrentUrl(next)
    } else if (videoRef.current) {
      videoRef.current.currentTime = 0
      void videoRef.current.play()?.catch(() => {})
    }
  }

  return (
    <Panel
      className={cn(
        "justify-center bg-black shadow-xl shadow-emerald-900/15 select-none",
        className
      )}
    >
      <AspectRatio ratio={16 / 9} className="max-h-full w-full overflow-hidden">
        {activeVideo ? (
          <video
            ref={videoRef}
            key={activeVideo.url}
            className={cn(
              "h-full w-full",
              fit === "cover" ? "object-cover" : "object-contain"
            )}
            src={activeVideo.url}
            autoPlay
            muted
            playsInline
            preload="auto"
            // Satu video saja: loop native agar ulang tanpa jeda
            loop={isSingle}
            onLoadStart={() => armTimer(activeVideo.url, LOAD_TIMEOUT_MS)}
            onLoadedData={() => {
              clearTimer()
              void videoRef.current?.play()?.catch(() => {})
            }}
            onPlaying={clearTimer}
            onTimeUpdate={() => {
              if (timerRef.current) clearTimer()
            }}
            onWaiting={() => armTimer(activeVideo.url, STALL_TIMEOUT_MS)}
            onStalled={() => armTimer(activeVideo.url, STALL_TIMEOUT_MS)}
            onEnded={handleEnded}
            onError={() => fail(activeVideo.url)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-black/60 text-[length:var(--fs-body)] text-[var(--c-muted)]">
            {labels.video.judul}
          </div>
        )}
      </AspectRatio>

      {/* Pemuat awal video berikutnya agar pergantian tidak menunggu unduhan */}
      {preloadUrl && (
        <video
          key={preloadUrl}
          src={preloadUrl}
          preload="auto"
          muted
          playsInline
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none fixed top-0 left-0 size-px opacity-0"
        />
      )}
    </Panel>
  )
}
