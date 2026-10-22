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
  /** "cover" fills the panel (may crop edges), "contain" shows the whole video */
  fit?: "cover" | "contain"
}

/** A failed video is skipped for this cooldown, then retried automatically. */
const FAILED_COOLDOWN_MS = 30_000
/** Max wait for a video to start loading before it is considered stuck. */
const LOAD_TIMEOUT_MS = 45_000
/** Max time a video may buffer without progress before it is handled. */
const STALL_TIMEOUT_MS = 30_000
/** When all videos have failed, re-check at this interval. */
const EMPTY_RETRY_MS = 5_000

/**
 * Built-in TV browsers (Samsung Tizen, LG webOS, etc.) often play <video>
 * through the system player, which easily enters fullscreen, especially when a
 * new video element is created. On these devices the element must not be
 * created/destroyed repeatedly, and the hidden preload element is disabled.
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

  // The playlist is never trimmed when a video fails; failures are recorded
  // per URL with their timestamp, and position is tracked by URL (not index).
  const failedRef = useRef<Record<string, number>>({})
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [, rerender] = useReducer((n: number) => n + 1, 0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Last played URL: the <video> element is kept even when all videos
  // are failing, so it is not torn down and recreated.
  const heldUrlRef = useRef<string | null>(null)
  // After a video fails, the same element is reloaded once it may be retried.
  const needsReloadRef = useRef(false)
  const [isTvBrowser, setIsTvBrowser] = useState(false)

  useEffect(() => {
    setIsTvBrowser(TV_BROWSER_PATTERN.test(navigator.userAgent))
  }, [])

  const isPlayable = (url: string) => {
    const failedAt = failedRef.current[url]
    return failedAt === undefined || Date.now() - failedAt > FAILED_COOLDOWN_MS
  }

  /** Next playable video after `fromUrl` (may be itself). */
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

  /** Real video error: skipped, retried after the cooldown. */
  const fail = (url: string) => {
    clearTimer()
    console.warn("Video skipped (failed):", url)
    failedRef.current[url] = Date.now()
    needsReloadRef.current = true
    setCurrentUrl(pickNext(url))
    rerender()
  }

  /** Video stuck/not starting: a single video is reloaded in the same element. */
  const stall = (url: string) => {
    clearTimer()
    if (items.length > 1) {
      fail(url)
      return
    }
    console.warn("Video stalled, reloading:", url)
    const el = videoRef.current
    if (el) {
      el.load()
      void el.play()?.catch(() => {})
    }
  }

  // The timer calls the latest `stall` to avoid using stale data
  const stallRef = useRef(stall)
  stallRef.current = stall

  const armTimer = (url: string, ms: number) => {
    clearTimer()
    timerRef.current = setTimeout(() => stallRef.current(url), ms)
  }

  // Clear the timer when the video changes or the component unmounts
  useEffect(() => clearTimer, [activeUrl, clearTimer])

  // Connection restored: retry all videos that previously failed
  useEffect(() => {
    const handleOnline = () => {
      failedRef.current = {}
      rerender()
    }
    window.addEventListener("online", handleOnline)
    return () => window.removeEventListener("online", handleOnline)
  }, [])

  // Tab/screen active again: make sure the video keeps playing
  useEffect(() => {
    const handleVisible = () => {
      if (!document.hidden) void videoRef.current?.play()?.catch(() => {})
    }
    document.addEventListener("visibilitychange", handleVisible)
    return () => document.removeEventListener("visibilitychange", handleVisible)
  }, [])

  // If the browser enters fullscreen for this video element, exit again.
  // Page-level fullscreen (kiosk mode) is left untouched.
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

  // All videos are failing: re-check periodically until one is playable
  useEffect(() => {
    if (items.length === 0 || activeVideo) return
    const timer = setTimeout(rerender, EMPTY_RETRY_MS)
    return () => clearTimeout(timer)
  })

  // A previously failed video may be retried: reload the same element
  // (src may be unchanged, in which case nothing would happen without this)
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
          // No `key`: the element is kept and only `src` changes,
          // because creating a new video element can trigger fullscreen on TVs.
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
            // Single video: native loop to repeat without a gap
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

      {/* Preloader for the next video so the switch does not wait for the download
          (disabled on TV browsers) */}
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
