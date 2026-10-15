import { LOCATION } from "@/lib/location"

/** WHO 2021 annual PM2.5 guideline (µg/m³), used for the "x pedoman WHO" ratio. */
const WHO_PM25_ANNUAL = 5

const CURRENT_VARS = [
  "us_aqi",
  "us_aqi_pm2_5",
  "us_aqi_pm10",
  "us_aqi_ozone",
  "us_aqi_nitrogen_dioxide",
  "us_aqi_sulphur_dioxide",
  "us_aqi_carbon_monoxide",
  "pm2_5",
  "pm10",
].join(",")

const CATEGORIES = [
  { max: 50, label: "Baik", color: "#a8e05f", textColor: "#0F0F0F" },
  { max: 100, label: "Sedang", color: "#fdd64b", textColor: "#0F0F0F" },
  {
    max: 150,
    label: "Tidak sehat bagi kelompok sensitif",
    color: "#ff9b57",
    textColor: "#0F0F0F",
  },
  { max: 200, label: "Tidak sehat", color: "#fe6a69", textColor: "#FAFAFA" },
  {
    max: 300,
    label: "Sangat tidak sehat",
    color: "#a97abc",
    textColor: "#FAFAFA",
  },
  { max: Infinity, label: "Berbahaya", color: "#a87383", textColor: "#FAFAFA" },
] as const

const POLLUTANTS: Record<string, string> = {
  us_aqi_pm2_5: "PM2.5",
  us_aqi_pm10: "PM10",
  us_aqi_ozone: "O3",
  us_aqi_nitrogen_dioxide: "NO2",
  us_aqi_sulphur_dioxide: "SO2",
  us_aqi_carbon_monoxide: "CO",
}

export interface AirQualityData {
  timestamp: number
  aqi: number
  category: string
  color: string
  textColor: string
  mainPollutant: string
  pm25: number
  whoTimes: number
}

export function buildAirQualityUrl(): string {
  return `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LOCATION.latitude}&longitude=${LOCATION.longitude}&current=${CURRENT_VARS}&timezone=auto`
}

/** Converts the Open-Meteo `current` object into display data. Returns null if invalid. */
export function parseAirQuality(
  current: Record<string, number> | undefined
): AirQualityData | null {
  if (!current || typeof current.us_aqi !== "number") return null

  const aqi = Math.round(current.us_aqi)
  const category = CATEGORIES.find((c) => aqi <= c.max) ?? CATEGORIES[5]
  const mainKey = Object.keys(POLLUTANTS).reduce((a, b) =>
    (current[a] ?? -1) >= (current[b] ?? -1) ? a : b
  )
  const pm25 = Number(current.pm2_5) || 0

  return {
    timestamp: Date.now(),
    aqi,
    category: category.label,
    color: category.color,
    textColor: category.textColor,
    mainPollutant: POLLUTANTS[mainKey],
    pm25,
    whoTimes: +(pm25 / WHO_PM25_ANNUAL).toFixed(1),
  }
}

/** Builds the running-text advisory from AQI and PM2.5. Returns null if data is incomplete. */
export function buildAirQualityAdvisory(
  aq: Partial<AirQualityData> | null | undefined
): string | null {
  if (!aq || typeof aq.aqi !== "number") return null

  const ratio =
    typeof aq.whoTimes === "number"
      ? aq.whoTimes
      : typeof aq.pm25 === "number"
        ? +(aq.pm25 / WHO_PM25_ANNUAL).toFixed(1)
        : null
  const fact =
    ratio !== null
      ? `Konsentrasi PM2.5 saat ini ${ratio} kali nilai panduan PM2.5 tahunan WHO. `
      : ""
  const head = `Kualitas udara ${aq.category ?? ""} (AQI ${aq.aqi}). `

  let advice: string
  if (aq.aqi <= 50) {
    advice = "Udara bersih, aman untuk beraktivitas di luar ruangan."
  } else if (aq.aqi <= 100) {
    advice =
      "Kelompok sensitif sebaiknya mengurangi aktivitas luar ruangan yang berkepanjangan."
  } else if (aq.aqi <= 150) {
    advice =
      "Kelompok sensitif hindari aktivitas luar ruangan dan gunakan masker bila perlu."
  } else {
    advice =
      "Hindari aktivitas luar ruangan, kurangi udara luar masuk ruangan, dan gunakan masker."
  }
  return `${head}${fact}${advice}`
}
