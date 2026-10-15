# Panduan: Air Quality ala IQAir dengan Open-Meteo API

Panduan untuk menampilkan data kualitas udara saat ini (current) berdasarkan titik lat/long, dengan format mirip IQAir: **US AQI**, **kategori + warna**, **polutan utama**, dan **PM2.5 vs pedoman WHO**.

---

## 1. Endpoint

```
https://air-quality-api.open-meteo.com/v1/air-quality
```

- Tanpa API key (untuk penggunaan non-komersial).
- Data berasal dari model atmosfer CAMS (resolusi sekitar 11 km), bukan sensor darat.

## 2. Parameter Request

| Parameter   | Nilai          | Keterangan                           |
| ----------- | -------------- | ------------------------------------ |
| `latitude`  | `1.6737`       | Titik lokasi (contoh: sekitar Dumai) |
| `longitude` | `101.4474`     | Titik lokasi                         |
| `current`   | lihat di bawah | Variabel data saat ini               |
| `timezone`  | `auto`         | Waktu mengikuti lokasi               |

Variabel `current` yang dibutuhkan:

```
us_aqi,
us_aqi_pm2_5, us_aqi_pm10, us_aqi_ozone,
us_aqi_nitrogen_dioxide, us_aqi_sulphur_dioxide, us_aqi_carbon_monoxide,
pm2_5, pm10
```

URL lengkap:

```
https://air-quality-api.open-meteo.com/v1/air-quality?latitude=1.6737&longitude=101.4474&current=us_aqi,us_aqi_pm2_5,us_aqi_pm10,us_aqi_ozone,us_aqi_nitrogen_dioxide,us_aqi_sulphur_dioxide,us_aqi_carbon_monoxide,pm2_5,pm10&timezone=auto
```

## 3. Cara Membentuk Tampilan ala IQAir

| Elemen IQAir         | Cara mendapatkannya                                         |
| -------------------- | ----------------------------------------------------------- |
| Angka besar AQI      | `current.us_aqi` (dibulatkan)                               |
| Kategori + warna     | Petakan angka AQI ke tabel kategori (bagian 4)              |
| Polutan utama        | Polutan dengan **sub-index tertinggi** di antara `us_aqi_*` |
| Konsentrasi PM2.5    | `current.pm2_5` (µg/m³)                                     |
| "x kali pedoman WHO" | `pm2_5 / 5` (pedoman tahunan WHO 2021 = 5 µg/m³)            |

## 4. Tabel Kategori US AQI

| AQI       | Kategori                            | Warna (hex) |
| --------- | ----------------------------------- | ----------- |
| 0 – 50    | Good (Baik)                         | `#a8e05f`   |
| 51 – 100  | Moderate (Sedang)                   | `#fdd64b`   |
| 101 – 150 | Unhealthy for Sensitive Groups      | `#ff9b57`   |
| 151 – 200 | Unhealthy (Tidak Sehat)             | `#fe6a69`   |
| 201 – 300 | Very Unhealthy (Sangat Tidak Sehat) | `#a97abc`   |
| 301+      | Hazardous (Berbahaya)               | `#a87383`   |

## 5. Contoh Respons

```json
{
  "current": {
    "time": "2026-10-15T14:00",
    "interval": 3600,
    "us_aqi": 85,
    "us_aqi_pm2_5": 85,
    "us_aqi_pm10": 38,
    "us_aqi_ozone": 40,
    "us_aqi_nitrogen_dioxide": 8,
    "us_aqi_sulphur_dioxide": 6,
    "us_aqi_carbon_monoxide": 3,
    "pm2_5": 28.5,
    "pm10": 40.2
  }
}
```

Hasil olahan:

```json
{
  "aqi": 85,
  "category": "Moderate",
  "color": "#fdd64b",
  "mainPollutant": "PM2.5",
  "pm25": 28.5,
  "whoTimes": 5.7
}
```

## 6. Implementasi JavaScript

```javascript
const CATEGORIES = [
  { max: 50, label: "Good", color: "#a8e05f" },
  { max: 100, label: "Moderate", color: "#fdd64b" },
  { max: 150, label: "Unhealthy for sensitive groups", color: "#ff9b57" },
  { max: 200, label: "Unhealthy", color: "#fe6a69" },
  { max: 300, label: "Very unhealthy", color: "#a97abc" },
  { max: Infinity, label: "Hazardous", color: "#a87383" },
]

const POLLUTANTS = {
  us_aqi_pm2_5: "PM2.5",
  us_aqi_pm10: "PM10",
  us_aqi_ozone: "O3",
  us_aqi_nitrogen_dioxide: "NO2",
  us_aqi_sulphur_dioxide: "SO2",
  us_aqi_carbon_monoxide: "CO",
}

async function getIQAirStyle(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: [
      "us_aqi",
      "us_aqi_pm2_5",
      "us_aqi_pm10",
      "us_aqi_ozone",
      "us_aqi_nitrogen_dioxide",
      "us_aqi_sulphur_dioxide",
      "us_aqi_carbon_monoxide",
      "pm2_5",
      "pm10",
    ].join(","),
    timezone: "auto",
  })

  const res = await fetch(
    `https://air-quality-api.open-meteo.com/v1/air-quality?${params}`
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const { current } = await res.json()

  const aqi = Math.round(current.us_aqi)
  const category = CATEGORIES.find((c) => aqi <= c.max)

  const mainKey = Object.keys(POLLUTANTS).reduce((a, b) =>
    (current[a] ?? -1) >= (current[b] ?? -1) ? a : b
  )

  return {
    time: current.time,
    aqi,
    category: category.label,
    color: category.color,
    mainPollutant: POLLUTANTS[mainKey],
    pm25: current.pm2_5,
    pm10: current.pm10,
    whoTimes: +(current.pm2_5 / 5).toFixed(1),
  }
}

getIQAirStyle(1.6737, 101.4474).then(console.log)
```

## 7. Implementasi Laravel (dengan Cache)

Data diperbarui per jam, jadi cukup di-cache 30 menit. Ini juga cocok untuk layar informasi yang refresh terus-menerus.

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class AirQualityService
{
    public function current(float $lat, float $lon): ?array
    {
        $key = "aqi:{$lat}:{$lon}";

        return Cache::remember($key, now()->addMinutes(30), function () use ($lat, $lon) {
            $response = Http::timeout(10)
                ->retry(2, 500)
                ->get('https://air-quality-api.open-meteo.com/v1/air-quality', [
                    'latitude'  => $lat,
                    'longitude' => $lon,
                    'current'   => 'us_aqi,us_aqi_pm2_5,us_aqi_pm10,us_aqi_ozone,us_aqi_nitrogen_dioxide,us_aqi_sulphur_dioxide,us_aqi_carbon_monoxide,pm2_5,pm10',
                    'timezone'  => 'auto',
                ]);

            if ($response->failed()) {
                return null;
            }

            $c   = $response->json('current');
            $aqi = (int) round($c['us_aqi']);

            [$label, $color] = match (true) {
                $aqi <= 50  => ['Good', '#a8e05f'],
                $aqi <= 100 => ['Moderate', '#fdd64b'],
                $aqi <= 150 => ['Unhealthy for sensitive groups', '#ff9b57'],
                $aqi <= 200 => ['Unhealthy', '#fe6a69'],
                $aqi <= 300 => ['Very unhealthy', '#a97abc'],
                default     => ['Hazardous', '#a87383'],
            };

            $subs = [
                'PM2.5' => $c['us_aqi_pm2_5'],
                'PM10'  => $c['us_aqi_pm10'],
                'O3'    => $c['us_aqi_ozone'],
                'NO2'   => $c['us_aqi_nitrogen_dioxide'],
                'SO2'   => $c['us_aqi_sulphur_dioxide'],
                'CO'    => $c['us_aqi_carbon_monoxide'],
            ];

            return [
                'time'           => $c['time'],
                'aqi'            => $aqi,
                'category'       => $label,
                'color'          => $color,
                'main_pollutant' => array_search(max($subs), $subs),
                'pm25'           => $c['pm2_5'],
                'pm10'           => $c['pm10'],
                'who_times'      => round($c['pm2_5'] / 5, 1),
            ];
        });
    }
}
```

Pemakaian di controller:

```php
$data = app(\App\Services\AirQualityService::class)->current(1.6737, 101.4474);
```

## 8. Contoh Tampilan (Tailwind)

```html
<div
  class="rounded-2xl p-6 text-gray-900"
  style="background: {{ $data['color'] }}"
>
  <div class="text-sm opacity-80">Kualitas Udara (US AQI)</div>
  <div class="text-7xl font-bold">{{ $data['aqi'] }}</div>
  <div class="text-xl font-semibold">{{ $data['category'] }}</div>
  <div class="mt-3 text-sm">
    Polutan utama: <b>{{ $data['main_pollutant'] }}</b> · PM2.5:
    <b>{{ $data['pm25'] }} µg/m³</b> · <b>{{ $data['who_times'] }}x</b> pedoman
    WHO
  </div>
  <div class="mt-1 text-xs opacity-70">Diperbarui: {{ $data['time'] }}</div>
</div>
```

## 9. Catatan Penting

1. **Angka bisa berbeda dari IQAir.** IQAir memadukan stasiun darat dan sensor low-cost, sedangkan Open-Meteo adalah model CAMS (grid sekitar 11 km). Skala dan kategori sama (US AQI), tetapi saat kabut asap atau kebakaran hutan selisihnya bisa cukup besar.
2. **Untuk angka yang persis sama dengan IQAir**, gunakan API IQAir (AirVisual). Ada tier gratis komunitas dengan batas pemanggilan yang ketat.
3. **Caching wajib**: data update tiap jam, jadi jangan panggil API di setiap page load. 30 hingga 60 menit sudah cukup.
4. **Fallback**: jika API gagal, tampilkan data cache terakhir dan jangan biarkan layar kosong.
5. **Lisensi**: gratis untuk non-komersial dengan batas harian. Cek syarat terbaru di <https://open-meteo.com/en/docs/air-quality-api>.
6. **Satuan WHO**: pedoman WHO 2021 untuk PM2.5 adalah 5 µg/m³ (rata-rata tahunan) dan 15 µg/m³ (rata-rata 24 jam). IQAir memakai pedoman tahunan untuk pengali "x kali".

## 10. Referensi

- Dokumentasi: <https://open-meteo.com/en/docs/air-quality-api>
- Skala US AQI: <https://www.airnow.gov/aqi/aqi-basics/>
