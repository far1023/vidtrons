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
/** Batas menunggu video mulai dimuat sebelum dianggap macet. */
const LOAD_TIMEOUT_MS = 45_000
/** Batas video macet (buffering) tanpa kemajuan sebelum ditangani. */
const STALL_TIMEOUT_MS = 30_000
/** Saat semua video gagal, cek ulang setiap interval ini. */
const EMPTY_RETRY_MS = 5_000

/**
 * Browser bawaan TV (Samsung Tizen, LG webOS, dll.) sering memutar <video>
 * lewat pemutar sistem yang mudah membuka layar penuh, terutama saat elemen
 * video baru dibuat. Di perangkat ini elemen tidak boleh dibuat/dibongkar
 * berulang dan elemen preload tersembunyi dimatikan.
 */
const TV_BROWSER_PATTERN = /Tizen|SMART-?TV|Web0S|WebOS|HbbTV/i

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
  // URL terakhir yang diputar: elemen <video> dipertahankan walau semua video
  // sedang gagal, supaya tidak dibongkar lalu dibuat ulang.
  const heldUrlRef = useRef<string | null>(null)
  // Setelah video gagal, elemen yang sama dimuat ulang saat sudah boleh dicoba.
  const needsReloadRef = useRef(false)
  const [isTvBrowser, setIsTvBrowser] = useState(false)

  useEffect(() => {
    setIsTvBrowser(TV_BROWSER_PATTERN.test(navigator.userAgent))
  }, [])

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

  if (activeUrl) heldUrlRef.current = activeUrl
  const heldUrl =
    heldUrlRef.current && items.some((i) => i.url === heldUrlRef.current)
      ? heldUrlRef.current
      : null
  const videoSrc = activeUrl ?? heldUrl

  const nextUrl = activeUrl ? pickNext(activeUrl) : null
  const hasDifferentNext = !!nextUrl && nextUrl !== activeUrl
  const isSingle = !hasDifferentNext
  const preloadUrl = hasDifferentNext && !isTvBrowser ? nextUrl : null

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  /** Video error nyata: dilewati, dicoba lagi setelah jeda. */
  const fail = (url: string) => {
    clearTimer()
    console.warn("Video dilewati (gagal):", url)
    failedRef.current[url] = Date.now()
    needsReloadRef.current = true
    setCurrentUrl(pickNext(url))
    rerender()
  }

  /** Video macet/tidak mulai: satu video dimuat ulang di elemen yang sama. */
  const stall = (url: string) => {
    clearTimer()
    if (items.length > 1) {
      fail(url)
      return
    }
    console.warn("Video macet, memuat ulang:", url)
    const el = videoRef.current
    if (el) {
      el.load()
      void el.play()?.catch(() => {})
    }
  }

  // Timer memanggil versi terbaru `stall` agar tidak memakai data usang
  const stallRef = useRef(stall)
  stallRef.current = stall

  const armTimer = (url: string, ms: number) => {
    clearTimer()
    timerRef.current = setTimeout(() => stallRef.current(url), ms)
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

  // Jika browser membuka layar penuh untuk elemen video ini, tutup lagi.
  // Layar penuh untuk seluruh halaman (mode kiosk) tidak disentuh.
  useEffect(() => {
    type FullscreenDoc = Document & {
      webkitFullscreenElement?: Element | null
      webkitExitFullscreen?: () => void
    }
    const leaveIfVideo = () => {
      const doc = document as FullscreenDoc
      const fsEl = doc.fullscreenElement ?? doc.webkitFullscreenElement
      if (!fsEl || fsEl !== videoRef.current) return
      if (doc.exitFullscreen) void doc.exitFullscreen().catch(() => {})
      else doc.webkitExitFullscreen?.()
    }
    document.addEventListener("fullscreenchange", leaveIfVideo)
    document.addEventListener("webkitfullscreenchange", leaveIfVideo)
    return () => {
      document.removeEventListener("fullscreenchange", leaveIfVideo)
      document.removeEventListener("webkitfullscreenchange", leaveIfVideo)
    }
  }, [])

  // Semua video sedang gagal: cek ulang berkala sampai ada yang bisa diputar
  useEffect(() => {
    if (items.length === 0 || activeVideo) return
    const timer = setTimeout(rerender, EMPTY_RETRY_MS)
    return () => clearTimeout(timer)
  })

  // Video yang tadi gagal sudah boleh dicoba lagi: muat ulang elemen yang sama
  // (src bisa saja tidak berubah, sehingga tanpa ini tidak ada yang terjadi)
  useEffect(() => {
    if (!activeUrl || !needsReloadRef.current) return
    needsReloadRef.current = false
    const el = videoRef.current
    if (el) {
      el.load()
      void el.play()?.catch(() => {})
    }
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
        {videoSrc && (
          // Tanpa `key`: elemen dipertahankan dan hanya `src` yang berganti,
          // karena membuat elemen video baru bisa memicu layar penuh di TV.
          <video
            ref={videoRef}
            className={cn(
              "pointer-events-none h-full w-full",
              fit === "cover" ? "object-cover" : "object-contain"
            )}
            src={videoSrc}
            autoPlay
            muted
            playsInline
            webkit-playsinline="true"
            disablePictureInPicture
            disableRemotePlayback
            preload="auto"
            // Satu video saja: loop native agar ulang tanpa jeda
            loop={isSingle}
            onLoadStart={() => armTimer(videoSrc, LOAD_TIMEOUT_MS)}
            onLoadedData={() => {
              clearTimer()
              void videoRef.current?.play()?.catch(() => {})
            }}
            onPlaying={clearTimer}
            onTimeUpdate={() => {
              if (timerRef.current) clearTimer()
            }}
            onWaiting={() => armTimer(videoSrc, STALL_TIMEOUT_MS)}
            onStalled={() => armTimer(videoSrc, STALL_TIMEOUT_MS)}
            onEnded={handleEnded}
            onError={() => fail(videoSrc)}
          />
        )}
        {!activeVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-[length:var(--fs-body)] text-[var(--c-muted)]">
            {labels.video.judul}
          </div>
        )}
      </AspectRatio>

      {/* Pemuat awal video berikutnya agar pergantian tidak menunggu unduhan
          (dimatikan di browser TV) */}
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
