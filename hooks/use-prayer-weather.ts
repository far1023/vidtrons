"use client";

import { useEffect, useRef, useState } from "react";
import { config, getTodayDateString } from "@/lib/config";
import { LOCATION } from "@/lib/location";
import {
  buildAlAdhanUrl,
  buildOpenMeteoUrl,
  parsePrayerTimings,
  type PrayerTimeItem,
} from "@/lib/data-sources";
import {
  buildAirQualityUrl,
  parseAirQuality,
  type AirQualityData,
} from "@/lib/air-quality";

const PRAYER_STORAGE_KEY = "bppddmi_prayer_data_cache";
const WEATHER_STORAGE_KEY = "bppddmi_weather_data_cache";
const AQI_STORAGE_KEY = "bppddmi_aqi_data_cache";

// Backoff schedule in milliseconds: 30s, 1m, 5m (then remains 5m)
const BACKOFF_DELAYS = [30_000, 60_000, 300_000];

export interface PrayerData {
  date: string;
  timings: PrayerTimeItem[];
}

export interface WeatherData {
  timestamp: number;
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  locationName: string;
}

export function usePrayerWeather() {
  const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);

  const prayerRetryCount = useRef(0);
  const weatherRetryCount = useRef(0);
  const aqiRetryCount = useRef(0);
  const prayerTimer = useRef<NodeJS.Timeout | null>(null);
  const weatherTimer = useRef<NodeJS.Timeout | null>(null);
  const aqiTimer = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  // Initialize from localStorage cache on mount
  useEffect(() => {
    isMounted.current = true;

    try {
      const storedPrayer = localStorage.getItem(PRAYER_STORAGE_KEY);
      if (storedPrayer) {
        setPrayerData(JSON.parse(storedPrayer));
      }
    } catch (e) {
      console.warn("Gagal membaca cache jadwal sholat:", e);
    }

    try {
      const storedWeather = localStorage.getItem(WEATHER_STORAGE_KEY);
      if (storedWeather) {
        const parsed = JSON.parse(storedWeather);
        if (parsed && typeof parsed.weatherCode === "number") {
          setWeatherData({
            timestamp: parsed.timestamp || Date.now(),
            temperature: parsed.temperature,
            weatherCode: parsed.weatherCode,
            isDay: Boolean(parsed.isDay),
            locationName: parsed.locationName || LOCATION.nama,
          });
        }
      }
    } catch (e) {
      console.warn("Gagal membaca cache cuaca:", e);
    }

    try {
      const storedAqi = localStorage.getItem(AQI_STORAGE_KEY);
      if (storedAqi) {
        const parsed = JSON.parse(storedAqi);
        if (parsed && typeof parsed.aqi === "number") setAirQuality(parsed);
      }
    } catch (e) {
      console.warn("Gagal membaca cache kualitas udara:", e);
    }

    // Helper: convert YYYY-MM-DD to DD-MM-YYYY
    const todayYYYYMMDD = getTodayDateString(config.timezone);
    const [y, m, d] = todayYYYYMMDD.split("-");
    const todayDDMMYYYY = `${d}-${m}-${y}`;

    // 1. Fetch Prayer Times
    async function fetchPrayer() {
      try {
        const url = buildAlAdhanUrl(todayDDMMYYYY);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`AlAdhan HTTP ${res.status}`);
        const json = await res.json();
        const rawTimings = json?.data?.timings;

        if (rawTimings) {
          const parsed = parsePrayerTimings(rawTimings);
          const dataToSave: PrayerData = {
            date: todayYYYYMMDD,
            timings: parsed,
          };

          if (isMounted.current) {
            setPrayerData(dataToSave);
            try {
              localStorage.setItem(PRAYER_STORAGE_KEY, JSON.stringify(dataToSave));
            } catch (err) {
              console.warn("Gagal menyimpan cache jadwal sholat:", err);
            }
          }
          return;
        }
        throw new Error("Format timings AlAdhan tidak valid");
      } catch (err) {
        console.warn("Fetch jadwal sholat gagal, menjadwalkan retry:", err);
        const delay =
          BACKOFF_DELAYS[
            Math.min(prayerRetryCount.current, BACKOFF_DELAYS.length - 1)
          ];
        prayerRetryCount.current += 1;

        if (isMounted.current) {
          prayerTimer.current = setTimeout(fetchPrayer, delay);
        }
      }
    }

    // 2. Fetch Weather
    async function fetchWeather() {
      try {
        const url = buildOpenMeteoUrl();
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
        const json = await res.json();
        const current = json?.current_weather;

        if (current) {
          const isDay = Boolean(current.is_day);
          const code = Number(current.weathercode);
          const temp = Math.round(Number(current.temperature));

          const dataToSave: WeatherData = {
            timestamp: Date.now(),
            temperature: temp,
            weatherCode: code,
            isDay,
            locationName: LOCATION.nama,
          };

          if (isMounted.current) {
            setWeatherData(dataToSave);
            try {
              localStorage.setItem(WEATHER_STORAGE_KEY, JSON.stringify(dataToSave));
            } catch (err) {
              console.warn("Gagal menyimpan cache cuaca:", err);
            }
          }
          return;
        }
        throw new Error("Format current_weather Open-Meteo tidak valid");
      } catch (err) {
        console.warn("Fetch cuaca gagal, menjadwalkan retry:", err);
        const delay =
          BACKOFF_DELAYS[
            Math.min(weatherRetryCount.current, BACKOFF_DELAYS.length - 1)
          ];
        weatherRetryCount.current += 1;

        if (isMounted.current) {
          weatherTimer.current = setTimeout(fetchWeather, delay);
        }
      }
    }

    // 3. Fetch Air Quality
    async function fetchAirQuality() {
      try {
        const res = await fetch(buildAirQualityUrl());
        if (!res.ok) throw new Error(`Air quality HTTP ${res.status}`);
        const json = await res.json();
        const parsed = parseAirQuality(json?.current);
        if (!parsed) throw new Error("Format air quality tidak valid");

        if (isMounted.current) {
          setAirQuality(parsed);
          try {
            localStorage.setItem(AQI_STORAGE_KEY, JSON.stringify(parsed));
          } catch (err) {
            console.warn("Gagal menyimpan cache kualitas udara:", err);
          }
        }
      } catch (err) {
        console.warn("Fetch kualitas udara gagal, menjadwalkan retry:", err);
        const delay =
          BACKOFF_DELAYS[
            Math.min(aqiRetryCount.current, BACKOFF_DELAYS.length - 1)
          ];
        aqiRetryCount.current += 1;
        if (isMounted.current) {
          aqiTimer.current = setTimeout(fetchAirQuality, delay);
        }
      }
    }

    // Trigger parallel initial fetches
    fetchPrayer();
    fetchWeather();
    fetchAirQuality();

    function handleOnline() {
      prayerRetryCount.current = 0;
      weatherRetryCount.current = 0;
      aqiRetryCount.current = 0;
      fetchPrayer();
      fetchWeather();
      fetchAirQuality();
    }
    window.addEventListener("online", handleOnline);

    return () => {
      isMounted.current = false;
      window.removeEventListener("online", handleOnline);
      if (prayerTimer.current) clearTimeout(prayerTimer.current);
      if (weatherTimer.current) clearTimeout(weatherTimer.current);
      if (aqiTimer.current) clearTimeout(aqiTimer.current);
    };
  }, []);

  return {
    prayerData,
    weatherData,
    airQuality,
  };
}
