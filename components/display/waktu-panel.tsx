"use client"

import { useEffect, useState } from "react"
import { Hourglass, Megaphone } from "lucide-react"
import { Panel } from "@/components/display/panel"
import { useClock } from "@/hooks/use-clock"
import { usePrayerWeather } from "@/hooks/use-prayer-weather"
import { usePrayerMode } from "@/hooks/use-prayer-mode"
import { config } from "@/lib/config"
import { labels } from "@/lib/labels"
import { cn } from "@/lib/utils"
import { getWeatherInfo } from "@/lib/weather-code"

/** Shared slide class: all slides stack in one grid cell, `data-active` shows one. */
export const slideClass =
  "col-start-1 row-start-1 flex min-h-0 flex-col justify-center p-[var(--pad)] opacity-0 pointer-events-none transition-opacity duration-700 data-[active=true]:opacity-100 data-[active=true]:pointer-events-auto"

/**
 * Menentukan warna teks suhu berdasarkan nilainya:
 * - Nyaman / sejuk (<= 28°C): warna gelap tegas (var(--c-text))
 * - Hangat (29°C - 31°C): amber / oranye hangat
 * - Panas (32°C - 33°C): oranye kemerahan
 * - Sangat panas (>= 34°C): merah keorenan tegas
 */
export function getTemperatureColor(temp: number): string {
  if (temp >= 34) return "text-red-600"
  if (temp >= 32) return "text-orange-600"
  if (temp >= 29) return "text-amber-600"
  return "text-[var(--c-text)]"
}

/**
 * Hitung mundur dalam kotak per satuan (Jam / Menit / Detik).
 * Jika format countdown bukan "HH:mm:ss" atau "mm:ss", tampil sebagai teks biasa.
 */
function CountdownTiles({ value }: { value: string }) {
  const parts = value.split(":")
  const valid =
    parts.length >= 2 &&
    parts.length <= 3 &&
    parts.every((p) => /^\d{1,2}$/.test(p))

  if (!valid) {
    return (
      <p className="text-[clamp(2.15rem,2.85vw,3.5rem)] leading-none font-extrabold tracking-tight tabular-nums drop-shadow-md">
        {value}
      </p>
    )
  }

  const units =
    parts.length === 3 ? ["Jam", "Menit", "Detik"] : ["Menit", "Detik"]

  return (
    <div className="flex items-start gap-2">
      {parts.map((part, i) => (
        <div key={units[i]} className="flex flex-col items-center gap-1">
          <span className="min-w-[2.4ch] rounded-md bg-black/35 px-2.5 py-1.5 text-[clamp(1.7rem,2.4vw,3rem)] leading-none font-extrabold tabular-nums ring-1 ring-white/20">
            {part.padStart(2, "0")}
          </span>
          <span className="text-[clamp(0.55rem,0.7vw,0.85rem)] font-medium tracking-widest text-white/70 uppercase">
            {units[i]}
          </span>
        </div>
      ))}
    </div>
  )
}

export type WaktuPanelProps = {
  className?: string
}

export function WaktuPanel({ className }: WaktuPanelProps) {
  const clock = useClock()
  const { prayerData, weatherData } = usePrayerWeather()
  const prayerMode = usePrayerMode(prayerData?.timings, clock.secondsNow)

  // State yang bergantung pada waktu sekarang (countdown, sholat berikutnya, mode azan)
  // berbeda antara server & browser. Tahan sampai mount agar hidrasi cocok.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const nextIndex = mounted ? prayerMode.nextIndex : -1

  // Available standard carousel slides: Jam & Cuaca dan Jadwal Sholat
  const availableSlides: string[] = ["jam-cuaca"]
  if (prayerData && prayerData.timings.length > 0)
    availableSlides.push("sholat")

  const [slideIndex, setSlideIndex] = useState(0)

  // Carousel rotation when not in azan mode
  useEffect(() => {
    if (prayerMode.isAzanMode || availableSlides.length <= 1) return

    const intervalMs = config.carouselDetik * 1000
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % availableSlides.length)
    }, intervalMs)

    return () => clearInterval(timer)
  }, [prayerMode.isAzanMode, availableSlides.length])

  const currentSlide = !mounted
    ? "jam-cuaca"
    : prayerMode.isAzanMode
      ? prayerMode.isArrived
        ? "azan-tiba"
        : "azan"
      : availableSlides[slideIndex % availableSlides.length] || "jam-cuaca"

  const displayPrayer = mounted ? prayerMode.targetPrayer : null

  const weatherInfo =
    weatherData && typeof weatherData.weatherCode === "number"
      ? getWeatherInfo(weatherData.weatherCode, weatherData.isDay)
      : null
  const WeatherIcon = weatherInfo?.icon

  return (
    <Panel
      className={cn(
        "relative isolate grid overflow-hidden bg-cover bg-center select-none",
        className
      )}
      style={{
        backgroundImage: "url('/images/waktu-panel.jpg')",
        contain: "paint",
      }}
    >
      {/* SLIDE 1: JAM & CUACA */}
      <div
        data-slide="jam-cuaca"
        data-active={String(currentSlide === "jam-cuaca")}
        className={cn(slideClass, "justify-between")}
      >
        <div className="flex flex-col p-4">
          <p className="text-[length:var(--fs-title)] leading-tight font-semibold">
            {clock.day}
          </p>
          <p className="text-[length:var(--fs-body)] text-[var(--c-muted)]">
            {clock.date}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[length:var(--fs-clock)] leading-none font-bold text-[var(--c-accent)] tabular-nums">
              {clock.time}
            </span>
            <span className="text-[length:var(--fs-body)] font-medium text-[var(--c-muted)]">
              {config.timezoneLabel}
            </span>
          </div>
        </div>

        {/* Info Cuaca dalam slide yang sama: stick ke bottom */}
        {weatherData && WeatherIcon && weatherInfo ? (
          <div className="mt-auto flex items-center justify-between rounded-xl bg-white/65 px-3 py-2 ring-1 ring-white/70">
            <div className="flex items-center gap-2.5">
              <WeatherIcon className="size-[var(--icon)] shrink-0" />
              <div className="flex flex-col">
                <span
                  className={cn(
                    "text-[length:var(--fs-title)] leading-tight font-bold tabular-nums",
                    getTemperatureColor(weatherData.temperature)
                  )}
                >
                  {weatherData.temperature}°C
                </span>
                <span className="text-[length:var(--fs-badge)] leading-tight text-[var(--c-muted)]">
                  {weatherInfo.label}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[length:var(--fs-badge)] font-medium text-[var(--c-muted)]">
                {weatherData.locationName}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* SLIDE 3: JADWAL SHOLAT (gaya kanban Jira) */}
      {prayerData && prayerData.timings.length > 0 ? (
        <div
          data-slide="sholat"
          data-active={String(currentSlide === "sholat")}
          className={slideClass}
        >
          <header className="flex items-center gap-2 px-1 pb-3.5 text-[length:var(--fs-badge)] font-semibold tracking-wide text-[var(--c-accent)] uppercase">
            <span>{labels.waktu.sholat}</span>
          </header>
          <ul className="flex flex-col gap-1.5 text-[length:var(--fs-body)]">
            {prayerData.timings.map((j, i) => {
              const isNext = i === nextIndex
              const isPassed = i < nextIndex
              return (
                <li
                  key={j.key}
                  data-next={String(isNext)}
                  className={cn(
                    "relative flex items-center justify-between gap-2 rounded-xl border-l-4 px-3 py-1.5 transition-all duration-300",
                    "shadow-[0_1px_1px_rgba(9,30,66,0.25),0_0_1px_rgba(9,30,66,0.31)]",
                    isNext
                      ? "z-10 scale-[1.05] transform-gpu border-l-[var(--c-accent)] bg-card font-bold shadow-[0_4px_10px_rgba(9,30,66,0.25),0_0_1px_rgba(9,30,66,0.31)] backface-hidden"
                      : "border-l-transparent bg-card/90",
                    isPassed && "text-muted-foreground"
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate">{j.nama}</span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 tabular-nums",
                      isNext
                        ? "text-[length:var(--fs-title)] text-[var(--c-accent)]"
                        : "font-medium"
                    )}
                  >
                    {j.waktu}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      {/* SLIDE 4: MENJELANG AZAN (hitung mundur) */}
      <div
        data-slide="azan"
        data-active={String(currentSlide === "azan")}
        className={cn(
          slideClass,
          "relative items-center justify-center overflow-hidden bg-cover bg-center text-center text-white"
        )}
        style={{ backgroundImage: "url('/images/menjelang-azan.jpeg')" }}
      >
        {/* Overlay gradasi untuk kontras teks (tanpa backdrop-blur agar tidak memicu GPU tile flicker) */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-zinc-700/55 via-zinc-800/60 to-zinc-900/75" />

        <div className="relative z-10 flex flex-col items-center gap-2">
          {displayPrayer ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[clamp(0.7rem,0.85vw,1rem)] font-semibold tracking-widest text-[var(--c-badge)] uppercase ring-1 ring-white/25">
                <Hourglass className="size-[1em]" />
                {labels.sholat.menjelang}
              </span>

              <div className="flex flex-col items-center">
                <h3 className="text-[clamp(1.25rem,1.7vw,2.1rem)] leading-tight font-bold drop-shadow-md">
                  {displayPrayer.nama}
                </h3>
                <p className="text-[clamp(0.8rem,1vw,1.2rem)] text-white/80 tabular-nums">
                  {displayPrayer.waktu} {config.timezoneLabel}
                </p>
              </div>

              <div className="mt-1">
                <CountdownTiles value={String(prayerMode.countdown)} />
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* SLIDE 5: WAKTU AZAN TIBA (aktif otomatis saat isArrived) */}
      <div
        data-slide="azan-tiba"
        data-active={String(currentSlide === "azan-tiba")}
        className={cn(
          slideClass,
          "relative items-center justify-center overflow-hidden bg-cover bg-center text-center text-white"
        )}
        style={{ backgroundImage: "url('/images/azan.png')" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-zinc-700/55 via-zinc-800/60 to-zinc-900/75" />

        <div className="relative z-10 flex flex-col items-center gap-2.5">
          {displayPrayer ? (
            <>
              {/* Ikon lonceng dengan halo berdenyut */}
              <div className="relative grid size-[clamp(2.6rem,3.4vw,4.4rem)] place-items-center">
                <span className="absolute inset-0 animate-pulse rounded-full bg-[var(--c-accent)]/40" />
                <span className="relative grid size-[78%] place-items-center rounded-full bg-[var(--c-accent)] ring-2 ring-white/30">
                  <Megaphone className="size-[52%]" />
                </span>
              </div>

              {/* <p className="text-[clamp(0.75rem,0.95vw,1.15rem)] font-bold tracking-widest text-[var(--c-badge)] uppercase drop-shadow-md">
                {labels.sholat.azan}
              </p> */}

              <div className="flex flex-col items-center">
                <h3 className="text-[clamp(1.7rem,2.5vw,3.2rem)] leading-none font-black tracking-tight drop-shadow-lg">
                  {displayPrayer.nama}
                </h3>
                <p className="mt-1.5 text-[clamp(0.9rem,1.15vw,1.4rem)] font-medium text-white/85 tabular-nums">
                  {displayPrayer.waktu} {config.timezoneLabel}
                </p>
              </div>

              <span className="mt-1 inline-flex items-center gap-2 rounded-full bg-[var(--c-accent)] px-3.5 py-1 text-[clamp(0.75rem,0.95vw,1.15rem)] font-semibold shadow-md">
                <span className="size-1.5 animate-pulse rounded-full bg-white" />
                {labels.sholat.sedangAzan}
              </span>
            </>
          ) : null}
        </div>
      </div>
    </Panel>
  )
}
