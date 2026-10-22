"use client"

import { Fragment, useEffect, useState, type CSSProperties } from "react"
import { Droplets, Hourglass, Megaphone, Wind } from "lucide-react"
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
 * Determines the temperature text color based on its value:
 * - Comfortable / cool (<= 28°C): strong dark color (var(--c-text))
 * - Warm (29°C - 31°C): warm amber / orange
 * - Hot (32°C - 33°C): reddish orange
 * - Very hot (>= 34°C): strong red
 */
export function getTemperatureColor(temp: number): string {
  if (temp >= 34) return "text-red-600"
  if (temp >= 32) return "text-orange-600"
  if (temp >= 29) return "text-amber-600"
  return "text-[var(--c-text)]"
}

/**
 * Face icon for the air quality card:
 * - AQI <= 100: smiling face
 * - AQI > 100: face wearing a mask
 */
function AirQualityFace({
  unhealthy,
  className,
}: {
  unhealthy: boolean
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="24" cy="24" r="19" />
      <path d="M9 20c8 0 14-4 17-9 3 4 8 8 13 9" />
      <path d="M17 22v1.5M31 22v1.5" />
      {unhealthy ? (
        <>
          <path d="M13 28h22v3c0 5-5 9-11 9s-11-4-11-9z" />
          <path d="M17 32h14M17 35h14" />
        </>
      ) : (
        <path d="M17 29c2 3 4 4 7 4s5-1 7-4" />
      )}
    </svg>
  )
}

/** Upper bound of each US AQI category (Good ... Hazardous). */
const AQI_UPPER = [50, 100, 150, 200, 300, 500]

/** Marker position on the AQI scale (6 equal-width segments), result 0-100. */
function aqiScalePercent(aqi: number): number {
  let lower = 0
  for (let i = 0; i < AQI_UPPER.length; i++) {
    const upper = AQI_UPPER[i]
    if (aqi <= upper) {
      const frac = Math.max(0, (aqi - lower) / (upper - lower))
      return ((i + frac) / AQI_UPPER.length) * 100
    }
    lower = upper
  }
  return 100
}

/** Clock with a blinking colon. If the format is not recognized, it is shown as is. */
function ClockDigits({ value }: { value: string }) {
  const parts = value.split(/[:.]/)
  if (parts.length < 2) return <>{value}</>
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 ? (
            <span className="mx-[0.03em] inline-block -translate-y-[0.05em] animate-[colon-blink_1s_ease-in-out_infinite] motion-reduce:animate-none">
              :
            </span>
          ) : null}
          {part}
        </Fragment>
      ))}
    </>
  )
}

/**
 * Countdown in boxes per unit (Hours / Minutes / Seconds).
 * If the countdown format is not "HH:mm:ss" or "mm:ss", it is shown as plain text.
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
          <span
            suppressHydrationWarning
            className="min-w-[2.4ch] rounded-md bg-black/35 px-2.5 py-1.5 text-[clamp(1.7rem,2.4vw,3rem)] leading-none font-extrabold tabular-nums ring-1 ring-white/20"
          >
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
  /** Data from usePrayerWeather (called once in DisplayScreen) */
  prayerWeather: ReturnType<typeof usePrayerWeather>
}

export function WaktuPanel({ className, prayerWeather }: WaktuPanelProps) {
  const clock = useClock()
  const { prayerData, weatherData, airQuality } = prayerWeather
  const prayerMode = usePrayerMode(prayerData?.timings, clock.secondsNow)

  // State that depends on the current time (countdown, next prayer, azan mode)
  // differs between server & browser. Hold until mount so hydration matches.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const nextIndex = mounted ? prayerMode.nextIndex : -1

  // Available standard carousel slides: Jam & Cuaca and Jadwal Sholat
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

  // Extra fields (optional): add them in usePrayerWeather to display.
  const extraWeather = weatherData as
    | (NonNullable<typeof weatherData> & {
        windSpeed?: number
        humidity?: number
      })
    | null
    | undefined
  const extraAir = airQuality as
    (NonNullable<typeof airQuality> & { pm25?: number }) | null | undefined
  const windSpeed = extraWeather?.windSpeed
  const humidity = extraWeather?.humidity
  const pm25 = extraAir?.pm25

  // Glow mengikuti warna kategori AQI (color-mix mendukung hex/rgb/hsl)
  const glowStyle: CSSProperties | undefined = airQuality
    ? ({
        "--glow": `color-mix(in srgb, ${airQuality.color} 85%, transparent)`,
        "--glow-soft": `color-mix(in srgb, ${airQuality.color} 45%, transparent)`,
      } as CSSProperties)
    : undefined

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
        <style>{`
          @keyframes colon-blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.2; }
          }
          @keyframes aqi-glow {
            0%, 100% {
              box-shadow: 0 0 8px 1px var(--glow-soft), 0 0 18px 3px var(--glow-soft);
            }
            50% {
              box-shadow: 0 0 14px 3px var(--glow), 0 0 28px 7px var(--glow-soft);
            }
          }
        `}</style>

        {/* Header: day, date, weather + large clock */}
        <div className="flex flex-col gap-2.5 p-4">
          <div className="flex items-start justify-between gap-3">
            {weatherData && WeatherIcon && weatherInfo ? (
              <div
                title={weatherInfo.label}
                aria-label={weatherInfo.label}
                className="flex shrink-0 items-center gap-2"
              >
                <WeatherIcon className="size-[calc(var(--icon))] shrink-0" />
                <div className="flex flex-col leading-none">
                  <span
                    className={cn(
                      "text-[length:var(--fs-title)] font-bold tabular-nums",
                      getTemperatureColor(weatherData.temperature)
                    )}
                  >
                    {weatherData.temperature}°C
                  </span>
                  <span className="mt-1 text-[length:var(--fs-badge)] text-[var(--c-muted)]">
                    {weatherInfo.label}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex items-baseline gap-2">
            <span
              suppressHydrationWarning
              className="text-[length:calc(var(--fs-title)*2.75)] leading-none font-bold text-[var(--c-accent)] tabular-nums drop-shadow-sm"
            >
              <ClockDigits value={clock.time} />
            </span>
            <span className="rounded-md bg-[var(--c-accent)]/15 px-1.5 py-0.5 text-[length:var(--fs-badge)] font-semibold text-[var(--c-accent)]">
              {config.timezoneLabel}
            </span>
          </div>

          {windSpeed != null || humidity != null ? (
            <div className="flex flex-wrap gap-2 text-[length:var(--fs-badge)] text-[var(--c-text)]">
              {windSpeed != null ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 ring-1 ring-white/80">
                  <Wind className="size-[1.2em] shrink-0 text-slate-500" />
                  <span className="tabular-nums">
                    {Math.round(windSpeed)} km/h
                  </span>
                </span>
              ) : null}
              {humidity != null ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 ring-1 ring-white/80">
                  <Droplets className="size-[1.2em] shrink-0 text-sky-500" />
                  <span className="tabular-nums">{Math.round(humidity)} %</span>
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Air Quality card with a category-colored glow: sticks to the bottom */}
        {airQuality ? (
          <div
            style={glowStyle}
            className="mt-auto animate-[aqi-glow_2.8s_ease-in-out_infinite] overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 motion-reduce:animate-none motion-reduce:shadow-[0_0_18px_4px_var(--glow-soft)]"
          >
            <div
              className="flex flex-col gap-2 px-3 pt-3 pb-3"
              style={{
                backgroundColor: airQuality.color,
                color: airQuality.textColor ?? "#0F0F0F",
              }}
            >
              <div className="flex items-center gap-3">
                {/* Kotak angka AQI */}
                <div className="flex shrink-0 flex-col items-center rounded-lg bg-black/15 px-2.5 py-1.5 leading-none">
                  <span className="text-[length:calc(var(--fs-title)*1.1)] font-bold tabular-nums">
                    {airQuality.aqi}
                  </span>
                  <span className="mt-1 text-[length:calc(var(--fs-badge)*0.85)] font-medium whitespace-nowrap">
                    AQI* US
                  </span>
                </div>

                {/* Kategori */}
                <span className="min-w-0 flex-1 text-[length:calc(var(--fs-title)*0.85)] leading-tight font-medium">
                  {airQuality.category}
                </span>

                {/* Ikon wajah */}
                <AirQualityFace
                  unhealthy={airQuality.aqi > 100}
                  className="size-[calc(var(--icon)*1.6)] shrink-0 opacity-80"
                />
              </div>

              {/* AQI scale with position marker */}
              <div
                className="relative my-1 h-1.5 rounded-full"
                style={{
                  background:
                    "linear-gradient(to right,#a8e05f 0 16.66%,#fdd64b 16.66% 33.33%,#ff9b57 33.33% 50%,#fe6a69 50% 66.66%,#a97abc 66.66% 83.33%,#a87383 83.33% 100%)",
                }}
              >
                <span
                  className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow ring-2 ring-black/50"
                  style={{ left: `${aqiScalePercent(airQuality.aqi)}%` }}
                />
              </div>

              {/* Polutan utama & konsentrasi */}
              <div className="flex items-center justify-between gap-2 text-[length:calc(var(--fs-body)*0.85)]">
                <span>Polutan utama: {airQuality.mainPollutant}</span>
                {pm25 != null ? (
                  <span className="font-medium tabular-nums">
                    {Math.round(pm25)} µg/m<sup>3</sup>
                  </span>
                ) : null}
              </div>
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
        {/* Gradient overlay for text contrast (no backdrop-blur to avoid GPU tile flicker) */}
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

      {/* SLIDE 5: AZAN TIME ARRIVED (activates automatically on isArrived) */}
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
              {/* Bell icon with a pulsing halo */}
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
