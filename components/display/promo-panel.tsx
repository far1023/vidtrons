"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type SyntheticEvent,
} from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import { config } from "@/lib/config"
import { labels } from "@/lib/labels"
import { normalizeMediaUrl } from "@/lib/media"
import { cn } from "@/lib/utils"

export type PromoItem = {
  id?: number
  judul: string
  gambarUrl: string
  urutan?: number
}

export type PromoPanelProps = {
  perView?: number
  intervalSeconds?: number
  items?: PromoItem[]
  className?: string
}

type ImageStatus = "loading" | "loaded" | "error"

/** Lebar maksimum gambar yang diminta dari Google (cukup untuk panel ini). */
const MAX_IMAGE_WIDTH = 1200

/**
 * `=s0` pada lh3.googleusercontent.com berarti "ukuran asli" (bisa belasan MB).
 * Itu lambat di-download dan berat di-decode pada perangkat signage, sehingga
 * slide sempat kosong. Ganti ke lebar tetap yang cukup untuk panel.
 */
function optimizeMediaUrl(url: string) {
  return url.replace(
    /(googleusercontent\.com\/.*)=s0$/,
    `$1=w${MAX_IMAGE_WIDTH}`
  )
}

/**
 * Gambar satu slide. Menyimpan status sendiri, mencoba ulang otomatis bila
 * gagal (backoff 5s -> 60s, atau segera saat koneksi pulih), dan tidak pernah
 * menghapus slide dari carousel.
 */
function PromoSlideImage({
  item,
  onStatus,
}: {
  item: PromoItem
  onStatus: (url: string, status: ImageStatus) => void
}) {
  const src = optimizeMediaUrl(normalizeMediaUrl(item.gambarUrl))
  const [status, setStatus] = useState<ImageStatus>("loading")
  const [attempt, setAttempt] = useState(0)
  const retriesRef = useRef(0)

  const update = useCallback(
    (next: ImageStatus) => {
      setStatus(next)
      onStatus(item.gambarUrl, next)
    },
    [item.gambarUrl, onStatus]
  )

  // Laporkan status awal agar autoplay tahu slide ini belum siap
  useEffect(() => {
    onStatus(item.gambarUrl, "loading")
  }, [item.gambarUrl, onStatus])

  const markLoaded = useCallback(
    (img: HTMLImageElement) => {
      const done = () => {
        retriesRef.current = 0
        update("loaded")
      }
      // "Siap" berarti sudah di-decode, bukan sekadar terunduh
      if (typeof img.decode === "function") img.decode().then(done, done)
      else done()
    },
    [update]
  )

  const retry = useCallback(() => {
    retriesRef.current += 1
    update("loading")
    setAttempt((a) => a + 1)
  }, [update])

  useEffect(() => {
    if (status !== "error") return
    const delay = Math.min(60_000, 5_000 * 2 ** retriesRef.current)
    const timer = setTimeout(retry, delay)
    window.addEventListener("online", retry)
    return () => {
      clearTimeout(timer)
      window.removeEventListener("online", retry)
    }
  }, [status, retry])

  // Tangani gambar yang sudah selesai dimuat sebelum handler terpasang (cache)
  const imgRef = useCallback(
    (el: HTMLImageElement | null) => {
      if (!el || !el.complete) return
      if (el.naturalWidth > 0) markLoaded(el)
      else if (el.currentSrc) update("error")
    },
    [markLoaded, update]
  )

  return (
    <>
      {status !== "loaded" && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-[var(--c-badge)] p-4 text-center text-[length:var(--fs-title)] text-[var(--c-muted)]",
            status === "loading" && "animate-pulse"
          )}
        >
          {status === "error" && (
            <span className="font-medium">{item.judul}</span>
          )}
        </div>
      )}
      {/* Plain <img>: media is hosted elsewhere, no next/image optimization. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={attempt}
        ref={imgRef}
        src={src}
        alt={item.judul}
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={(e: SyntheticEvent<HTMLImageElement>) =>
          markLoaded(e.currentTarget)
        }
        onError={() => update("error")}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
          status === "loaded" ? "opacity-100" : "opacity-0"
        )}
      />
    </>
  )
}

/**
 * Horizontal carousel of portrait promo images. No card: no border, header or
 * panel background; the carousel fills its grid cell with automated interval loop.
 */
export function PromoPanel({
  perView = config.promoPerTampilan || 1,
  intervalSeconds = config.promoDetik || 8,
  items,
  className,
}: PromoPanelProps) {
  const [api, setApi] = useState<CarouselApi>()
  const statusRef = useRef<Record<string, ImageStatus>>({})

  const handleStatus = useCallback((url: string, status: ImageStatus) => {
    statusRef.current[url] = status
  }, [])

  // Jumlah slide dijaga stabil: slide tidak lagi dibuang saat gambar gagal.
  const slides: (PromoItem | null)[] = (() => {
    const valid = (items ?? []).filter((item) => item.gambarUrl)
    if (valid.length) return valid
    if (config.promoDefault) {
      return [
        {
          judul: labels.promo.judul,
          gambarUrl: normalizeMediaUrl(config.promoDefault),
        },
      ]
    }
    return Array.from({ length: perView }, () => null)
  })()

  const slidesRef = useRef(slides)
  slidesRef.current = slides

  // Loop Embla butuh slide yang cukup banyak; untuk sedikit slide pakai rewind
  const canLoop = slides.length >= perView + 2
  const opts = useMemo(
    () => ({ loop: canLoop, align: "start" as const }),
    [canLoop]
  )

  // Autoplay: hanya geser ke slide yang gambarnya sudah siap, supaya tidak
  // pernah menampilkan slide kosong. Slide gagal/sedang dimuat dilewati.
  useEffect(() => {
    if (!api || slides.length <= 1) return

    const timer = setInterval(() => {
      if (document.hidden) return

      const total = api.scrollSnapList().length
      if (total <= 1) return

      const current = api.selectedScrollSnap()
      const isReady = (index: number) => {
        const slide = slidesRef.current[index]
        if (!slide) return true
        return statusRef.current[slide.gambarUrl] === "loaded"
      }

      const next = (current + 1) % total
      if (isReady(next)) {
        if (next === current + 1 && api.canScrollNext()) api.scrollNext()
        else api.scrollTo(next)
        return
      }

      for (let offset = 2; offset < total; offset++) {
        const candidate = (current + offset) % total
        if (isReady(candidate)) {
          api.scrollTo(candidate)
          return
        }
      }
      // Tidak ada slide lain yang siap: tetap di slide saat ini
    }, intervalSeconds * 1000)

    return () => clearInterval(timer)
  }, [api, slides.length, intervalSeconds])

  // Tab/layar kembali aktif: hitung ulang posisi (timer & animasi ditahan
  // browser saat tab tersembunyi sehingga posisi carousel bisa tidak sinkron)
  useEffect(() => {
    if (!api) return
    const handleVisible = () => {
      if (!document.hidden) api.reInit()
    }
    document.addEventListener("visibilitychange", handleVisible)
    return () => document.removeEventListener("visibilitychange", handleVisible)
  }, [api])

  return (
    <div
      className={cn(
        "aspect-[4.2/5.5] min-h-0 w-full min-w-0 shrink-0 overflow-hidden select-none",
        className
      )}
    >
      <Carousel
        setApi={setApi}
        opts={opts}
        orientation="horizontal"
        style={{ "--per-view": perView } as CSSProperties}
        className="h-full min-h-0 w-full [&_[data-slot=carousel-content]]:h-full"
      >
        <CarouselContent className="ml-[calc(var(--gap)/-2)] h-full">
          {slides.map((item, index) => (
            <CarouselItem
              key={
                item
                  ? (item.id ?? `${item.gambarUrl}#${index}`)
                  : `placeholder-${index}`
              }
              className="h-full min-h-0 basis-[calc(100%/var(--per-view))] px-[calc(var(--gap)/2)]"
            >
              <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-card shadow-lg ring-1 shadow-emerald-900/10 ring-white/70">
                {item ? (
                  <PromoSlideImage item={item} onStatus={handleStatus} />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[var(--c-badge)] p-4 text-center text-[length:var(--fs-title)] text-[var(--c-muted)]">
                    <span className="font-medium">{labels.promo.judul}</span>
                  </div>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
