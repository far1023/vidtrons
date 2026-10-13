# DATA-SOURCES: prayer times and weather

Two third-party APIs feed the WaktuPanel. Both are fetched **once on initial page load**, directly by the browser. They are not part of the 60-second `/api/display` polling, and there is no server proxy.

| Data          | Provider   | When fetched                           |
| ------------- | ---------- | -------------------------------------- |
| Jadwal sholat | AlAdhan    | Initial page load (+ retry on failure) |
| Cuaca         | Open-Meteo | Initial page load (+ retry on failure) |

Coordinates come from `lib/location.ts` (Kota Dumai: 1.66711, 101.44316). Endpoints and the AlAdhan method live in `lib/data-sources.ts`. Never repeat these numbers elsewhere.

## Prayer times (AlAdhan)

Endpoint pattern:

```text
https://api.aladhan.com/v1/timings/{DD-MM-YYYY}?latitude={lat}&longitude={lon}&method=11
```

- `{DD-MM-YYYY}` is today's date in `DASHBOARD_TIMEZONE`, not the device or UTC date (example: `06-10-2026`).
- `method=11` is the value requested by the user. See the SPEC open question: confirm what 11 means on `https://api.aladhan.com/v1/methods` and compare with the official Dumai schedule.
- Fields used from `data.timings`: `Fajr`, `Dhuhr`, `Asr`, `Maghrib`, `Isha`. Ignore the rest.
- Parse only the first 5 characters (`HH:mm`) of each value, in case a timezone suffix is present.
- Map to the shape used by LAYOUT.md: `[{ nama, waktu }]`, earliest first, with names Subuh, Dzuhur, Ashar, Maghrib, Isya (names from `lib/labels.ts`).
- If the official schedule differs by a few minutes, add per-prayer minute adjustments in `lib/data-sources.ts`.

## Weather (Open-Meteo)

Endpoint pattern:

```text
https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true
```

- Fields used from `current_weather`: `temperature` (°C), `weathercode`, `is_day` (1 day, 0 night). Verify the exact field names against a live response when implementing.
- `current_weather.time` is not displayed (it is GMT unless a `timezone` parameter is added).
- The city label on the Cuaca slide comes from `lib/location.ts`.

## Fetch behavior

- Both requests run in parallel on mount. One failing never blocks the other.
- On failure, retry with backoff (30 s, 1 min, 5 min, then every 5 min) until it succeeds. This is the only repeat fetching.
- Cache the last good result in localStorage. Prayer times store the date they were fetched for; weather stores the fetch timestamp.
- If a fetch fails, fall back to the cached result, even from a previous day (prayer times drift only slowly).
- No prayer data: the Jadwal Sholat slide and azan mode are disabled (LAYOUT.md). No weather data: the Cuaca slide is removed.
- Staleness after the first fetch is an open question in `SPEC.md`.

## Weather code mapping (WMO codes as used by Open-Meteo)

The mapping lives in one file, `lib/weather-code.ts`: a lookup from code to label key and icon (day and night variants). Labels (Indonesian) go through `lib/labels.ts`. Icons come from `lucide-react`, which shadcn already uses. Size icons with a token. Verify the code list against the Open-Meteo docs when implementing.

| Code(s)                | Label (Indonesian)            | Icon (day)     | Icon (night)   |
| ---------------------- | ----------------------------- | -------------- | -------------- |
| 0                      | Cerah                         | Sun            | Moon           |
| 1                      | Cerah berawan                 | CloudSun       | CloudMoon      |
| 2                      | Berawan sebagian              | CloudSun       | CloudMoon      |
| 3                      | Mendung                       | Cloud          | Cloud          |
| 45, 48                 | Berkabut                      | CloudFog       | CloudFog       |
| 51, 53, 55             | Gerimis                       | CloudDrizzle   | CloudDrizzle   |
| 56, 57                 | Gerimis beku                  | CloudDrizzle   | CloudDrizzle   |
| 61                     | Hujan ringan                  | CloudRain      | CloudRain      |
| 63                     | Hujan sedang                  | CloudRain      | CloudRain      |
| 65                     | Hujan lebat                   | CloudRainWind  | CloudRainWind  |
| 66, 67                 | Hujan beku                    | CloudRain      | CloudRain      |
| 71, 73, 75, 77, 85, 86 | Salju                         | CloudSnow      | CloudSnow      |
| 80                     | Hujan lokal ringan            | CloudRain      | CloudRain      |
| 81                     | Hujan lokal sedang            | CloudRain      | CloudRain      |
| 82                     | Hujan lokal lebat             | CloudRainWind  | CloudRainWind  |
| 95                     | Badai petir                   | CloudLightning | CloudLightning |
| 96, 99                 | Badai petir disertai hujan es | CloudHail      | CloudHail      |
| any other              | Tidak diketahui               | Cloud          | Cloud          |

Snow codes are unlikely in Dumai but are mapped so an unexpected code never breaks the slide. The fallback row is mandatory.
