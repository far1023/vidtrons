# Layout Dashboard Informasi Lobby Bappeda

> **Status dokumen:** perencanaan awal (legacy) yang awalnya ditulis untuk Laravel Blade. Implementasi sekarang memakai Next.js, shadcn/ui, dan Drizzle. Potongan kode Blade dan JavaScript di dokumen ini hanya menjelaskan **perilaku** dan **kelas Tailwind**; jangan disalin sebagai kode.
>
> | Di dokumen ini            | Di implementasi                                                        |
> | ------------------------- | ---------------------------------------------------------------------- |
> | Komponen/view Blade       | Komponen React (`docs/COMPONENTS.md`)                                  |
> | `data-*` + script vanilla | Hook React (`use-clock`, `use-autoscroll`, `use-prayer-mode`)          |
> | `config/dashboard.php`    | Env + `lib/config.ts` (section 6)                                      |
> | `__('dashboard.x')`       | `lib/labels.ts`                                                        |
> | `resources/css/app.css`   | `app/globals.css`                                                      |
> | Jadwal sholat dari server | Fetch dari browser sekali saat halaman dimuat (`docs/DATA-SOURCES.md`) |
>
> Perubahan dari rencana awal: layar bersifat **pasif** (tanpa scroll manual dan tanpa penanda "Lihat"), baris panel memakai `fr`, token radius bernama `--radius-panel`, warna memakai token `--c-*` (dari `docs/DESIGN.md`), dan lokasi di-hard-code (Kota Dumai).

## 1. Konsep Umum

Dashboard ditujukan untuk **layar informasi digital di lobby Bappeda** dengan orientasi landscape dan rasio utama **16:9**.

Prinsip desain:

- Informasi harus dapat dibaca cepat dari jarak beberapa meter.
- Tidak ada scrolling pada layout utama.
- Setiap area berukuran fluid agar mengikuti berbagai resolusi layar.
- Video dan gambar mempertahankan rasionya (video memakai `object-cover` sehingga tepi dapat terpotong sedikit; gambar promo memakai `object-contain`).
- Ukuran teks, icon, padding, gap, dan radius bersifat responsif.
- Layout utama tidak di-scroll. Panel dengan data banyak (pengumuman, agenda) bergulir otomatis di dalam panelnya (layar pasif, tanpa scroll manual); promo ditampilkan sebagai carousel.
- Panel waktu berupa carousel (jam, cuaca, jadwal sholat) dan otomatis beralih ke info azan menjelang waktu sholat.
- Footer dekoratif dihilangkan agar ruang layar dipakai untuk informasi yang berguna.
- **Tidak ada nilai hard-coded**: proporsi dan ukuran diambil dari _design token_ (CSS variable), sedangkan konten (nama instansi, pengumuman, agenda, dll.) diambil dari data dinamis. Satu-satunya pengecualian adalah lokasi (Kota Dumai dan koordinatnya), yang sengaja di-hard-code di `lib/location.ts`.

---

## 2. Struktur Vertikal Utama

Layar dibagi menjadi tiga zona:

| Zona         | Tinggi | Fungsi                                                        |
| ------------ | -----: | ------------------------------------------------------------- |
| Header       |    10% | Identitas instansi, logo, branding, slogan                    |
| Main Content |    85% | Video, waktu/cuaca/sholat, promosi, PANDU, pengumuman, agenda |
| Running Text |     5% | Informasi berjalan                                            |

### Visual

```text
┌──────────────────────────────────────────────────────────────┐
│                         HEADER 10%                           │
├──────────────┬───────────────────────────┬───────────────────┤
│              │                           │                   │
│   WAKTU /    │                           │    PENGUMUMAN     │
│   CUACA /    │          VIDEO            │                   │
│   SHOLAT     │                           ├───────────────────┤
├──────────────┤                           │                   │
│              ├───────────────────────────┤      AGENDA       │
│   PROMO /    │          PANDU            │                   │
│   BAPPEDA    │                           │                   │
├──────────────┴───────────────────────────┴───────────────────┤
│                      RUNNING TEXT 5%                         │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Design Token

Seluruh proporsi dan ukuran didefinisikan **satu kali** sebagai CSS variable. Mengubah layout cukup dengan mengubah token, tanpa menyentuh markup.

```css
/* app/globals.css */
:root {
  /* Pembagian layout */
  --rows-screen: 10% 85% 5%; /* header | main | running text */
  --cols-main: 2fr 6fr 4fr; /* kiri | tengah | kanan */
  --rows-left: 38fr 62fr; /* waktu/cuaca | promo */
  --rows-center: 64fr 36fr; /* video | PANDU */
  --rows-right: 53fr 47fr; /* pengumuman | agenda */

  /* Ukuran responsif */
  --gap: clamp(6px, 0.6vw, 16px);
  --pad: clamp(8px, 0.7vw, 20px);
  --pad-x: clamp(8px, 0.8vw, 20px);
  --radius-panel: clamp(
    8px,
    0.6vw,
    16px
  ); /* jangan menimpa --radius milik shadcn */
  --icon: clamp(1rem, 1.5vw, 2rem);

  /* Tipografi */
  --fs-clock: clamp(2rem, 3.5vw, 4.5rem);
  --fs-title: clamp(0.75rem, 1vw, 1.25rem);
  --fs-body: clamp(0.65rem, 0.8vw, 1rem);
  --fs-badge: clamp(0.6rem, 0.7vw, 0.9rem);
  --fs-countdown: clamp(2.5rem, 4.5vw, 6rem);

  /* Efek pudar pada panel yang dapat digulir */
  --fade-mask: linear-gradient(to bottom, black 88%, transparent);
}
```

> Pada Tailwind, ukuran teks berbasis variable perlu petunjuk tipe, misalnya `text-[length:var(--fs-title)]`, agar tidak dianggap sebagai warna.

### Token warna (usulan, disetujui di T2)

Nilai diambil dari `docs/DESIGN.md` (tema emerald). Jangan menyalin blok `:root` atau `@theme` milik DESIGN.md ke `app/globals.css`; ambil hanya warna di bawah ini.

| Token           | Nilai     | Sumber di DESIGN.md        | Dipakai untuk                               |
| --------------- | --------- | -------------------------- | ------------------------------------------- |
| `--c-bg`        | `#fbfffd` | Soft White (canvas)        | Latar layar                                 |
| `--c-panel`     | `#ffffff` | Pure White (card)          | Latar panel                                 |
| `--c-border`    | `#a7f3d0` | Mint Mist (emerald-200)    | Border panel 1px, tanpa shadow              |
| `--c-text`      | `#1d1c1d` | Carbon                     | Teks utama                                  |
| `--c-muted`     | `#696969` | Mid Gray                   | Teks sekunder                               |
| `--c-accent`    | `#047857` | Emerald Core (emerald-700) | Ikon, penanda aktif, hitung mundur          |
| `--c-highlight` | `#a7f3d0` | Mint Mist                  | Baris sholat berikutnya (dengan teks tebal) |
| `--c-azan-bg`   | `#ecfdf5` | Emerald Haze (emerald-50)  | Latar slide azan                            |
| `--c-badge`     | `#ecfdf5` | Emerald Haze               | Latar badge dan pil                         |
| `--c-band`      | `#064e3b` | Deep Emerald (emerald-900) | Usulan: latar header dan running text       |
| `--c-on-band`   | `#ffffff` | Pure White                 | Teks di atas `--c-band`                     |

Catatan:

- **Ukuran** tetap memakai token `--fs-*` dan `--pad`; skala tipografi DESIGN.md (64 sampai 96px) untuk halaman marketing tidak dipakai karena layar dibaca dari jauh.
- **Font:** font Salesforce di DESIGN.md berlisensi, jadi pakai pengganti gratis lewat `next/font` (heading: Outfit, DM Sans, atau Inter Tight; isi: Inter, IBM Plex Sans, atau Geist). Pilihan akhir di T2.
- **Panel:** radius mengikuti `--radius-panel` (maksimum 16px, selaras DESIGN.md), border mint 1px, tanpa shadow.
- **Gradient** hanya untuk teks dekoratif; tidak dipakai pada permukaan (kecuali `--fade-mask`).

---

## 4. Struktur Tailwind Utama

Gunakan CSS Grid sebagai fondasi layout:

```html
<div
  class="grid h-screen w-screen grid-rows-[var(--rows-screen)] overflow-hidden bg-[var(--c-bg)]"
>
  <!-- HEADER -->
  <header class="min-h-0">...</header>

  <!-- MAIN CONTENT -->
  <main
    class="grid min-h-0 grid-cols-[var(--cols-main)] gap-[var(--gap)] px-[var(--pad-x)]"
  >
    ...
  </main>

  <!-- RUNNING TEXT -->
  <div class="min-h-0 overflow-hidden">...</div>
</div>
```

### Kenapa `fr` untuk kolom?

`fr` membagi ruang yang tersisa setelah memperhitungkan `gap` dan padding, sehingga lebih aman saat ukuran layar berubah dibandingkan persentase langsung (misalnya `16.7% 50% 33.3%`).

Alasan yang sama berlaku untuk baris di dalam kolom: token `--rows-left`, `--rows-center`, dan `--rows-right` memakai `fr`, karena baris `%` ditambah `gap` melebihi 100% tinggi kolom dan membuat panel paling bawah meluber. `--rows-screen` tetap `%` karena tidak memakai `gap`.

---

## 5. Pembagian Kolom Main Content

Main content terdiri dari 12 bagian logis (`2fr + 6fr + 4fr`):

| Kolom  | Rasio | Perkiraan | Fungsi                             |
| ------ | ----: | --------: | ---------------------------------- |
| Kiri   |   2fr |     16,7% | Waktu, cuaca, jadwal sholat, promo |
| Tengah |   6fr |       50% | Video dan PANDU                    |
| Kanan  |   4fr |     33,3% | Pengumuman dan agenda              |

---

## 6. Kolom Kiri

Berisi panel **waktu, cuaca, dan jadwal sholat** (carousel) serta banner/promosi Bappeda. Pembagian tinggi mengikuti token `--rows-left` (default 38fr / 62fr).

```html
<section class="grid min-h-0 grid-rows-[var(--rows-left)] gap-[var(--gap)]">
  <!-- CAROUSEL: WAKTU / CUACA / JADWAL SHOLAT / INFO AZAN -->
  <div id="panel-waktu" class="min-h-0 overflow-hidden">...</div>

  <!-- PROMO (CAROUSEL) -->
  <div class="min-h-0 overflow-hidden">...</div>
</section>
```

### Mode tampilan

Panel bekerja dengan dua mode yang berganti otomatis berdasarkan jadwal sholat:

| Mode     | Kondisi                                                    | Tampilan                                          |
| -------- | ---------------------------------------------------------- | ------------------------------------------------- |
| Carousel | Default, di luar jendela waktu azan                        | Berputar: **Jam** → **Cuaca** → **Jadwal Sholat** |
| Azan     | Dari _N_ menit sebelum s.d. _M_ menit sesudah waktu sholat | Satu slide tetap berisi info azan terdekat        |

Alur:

```text
        ┌──────────────── CAROUSEL ────────────────┐
        │  Jam  →  Cuaca  →  Jadwal Sholat  → (ulang) │
        └───────────────────┬──────────────────────┘
                            │ waktu sholat − N menit
                            ▼
        ┌────────────────── AZAN ──────────────────┐
        │  Hitung mundur → "waktu azan telah tiba"  │
        └───────────────────┬──────────────────────┘
                            │ waktu sholat + M menit
                            ▼
                    kembali ke CAROUSEL
```

Nilai _N_ (sebelum), _M_ (sesudah), dan interval carousel **tidak ditulis di markup atau script**, tetapi dibaca dari konfigurasi.

### Konfigurasi

Nilai dibaca dari env dan diketik di `lib/config.ts`:

| Kunci                | Env                            | Default               | Keterangan                           |
| -------------------- | ------------------------------ | --------------------- | ------------------------------------ |
| `timezone`           | `DASHBOARD_TIMEZONE`           | (mis. `Asia/Jakarta`) | Zona waktu untuk semua perhitungan   |
| `timezone_label`     | `DASHBOARD_TIMEZONE_LABEL`     | (mis. `WIB`)          | Label di slide jam                   |
| `carousel_detik`     | `DASHBOARD_CAROUSEL_DETIK`     | 10                    | Interval carousel waktu              |
| `azan_sebelum_menit` | `DASHBOARD_AZAN_SEBELUM_MENIT` | 10                    | Mode azan mulai _N_ menit sebelum    |
| `azan_sesudah_menit` | `DASHBOARD_AZAN_SESUDAH_MENIT` | 5                     | Mode azan berakhir _M_ menit sesudah |
| `promo_detik`        | `DASHBOARD_PROMO_DETIK`        | 8                     | Interval carousel promo              |
| `promo_per_tampilan` | `DASHBOARD_PROMO_PER_TAMPILAN` | 1                     | Jumlah promo per tampilan            |
| `promo_default`      | `DASHBOARD_PROMO_DEFAULT`      | (URL gambar)          | Gambar cadangan                      |
| `scroll_kecepatan`   | `DASHBOARD_SCROLL_KECEPATAN`   | 0.06                  | Fraksi tinggi panel per detik        |
| `scroll_jeda_detik`  | `DASHBOARD_SCROLL_JEDA_DETIK`  | 3                     | Jeda di ujung atas dan bawah         |

Dihapus dari rencana awal: `kota` (lokasi di-hard-code di `lib/location.ts`), `scroll_lanjut_detik` (layar pasif, tidak ada interaksi manual), dan `promo_arah` (promo selalu carousel horizontal).

### Sumber data jadwal sholat

Jadwal sholat diambil dari API AlAdhan oleh browser sekali saat halaman dimuat (lihat `docs/DATA-SOURCES.md`), bukan diketik manual. Bentuk data yang dipakai komponen:

```json
[{ "nama": "{nama sholat}", "waktu": "HH:mm" }]
```

Isi daftar sesuai kebutuhan (umumnya Subuh, Dzuhur, Ashar, Maghrib, Isya), diurutkan dari waktu paling awal. Jika daftar kosong, slide jadwal sholat dan mode azan otomatis dinonaktifkan.

### Struktur HTML

Semua slide ditumpuk pada satu sel grid (`col-start-1 row-start-1`) sehingga tidak membutuhkan posisi absolut. Slide aktif ditandai atribut `data-active="true"`.

```html
<div
  id="panel-waktu"
  class="grid min-h-0 overflow-hidden"
  data-timezone="{{ config('dashboard.timezone') }}"
  data-interval="{{ config('dashboard.carousel_detik') }}"
  data-before="{{ config('dashboard.azan_sebelum_menit') }}"
  data-after="{{ config('dashboard.azan_sesudah_menit') }}"
  data-jadwal="@json($jadwalSholat)"
>
  @php $slide = 'col-start-1 row-start-1 min-h-0 p-[var(--pad)] flex flex-col
  justify-center opacity-0 pointer-events-none transition-opacity duration-700
  data-[active=true]:opacity-100'; @endphp

  <!-- SLIDE 1: JAM -->
  <div data-slide="jam" data-active="true" class="{{ $slide }}">
    <p data-day class="text-[length:var(--fs-title)]"></p>
    <p data-date class="text-[length:var(--fs-body)]"></p>
    <span data-clock class="text-[length:var(--fs-clock)] font-bold"></span>
    <span class="text-[length:var(--fs-body)]"
      >{{ config('dashboard.timezone_label') }}</span
    >
  </div>

  <!-- SLIDE 2: CUACA -->
  <div data-slide="cuaca" data-active="false" class="{{ $slide }}">
    <p class="text-[length:var(--fs-title)]">{{ $cuaca->kota }}</p>
    <p class="text-[length:var(--fs-clock)] font-bold">{{ $cuaca->suhu }}°C</p>
    <p class="text-[length:var(--fs-body)]">{{ $cuaca->kondisi }}</p>
  </div>

  <!-- SLIDE 3: JADWAL SHOLAT -->
  <div data-slide="sholat" data-active="false" class="{{ $slide }}">
    <h3 class="text-[length:var(--fs-title)] font-semibold">
      {{ __('dashboard.jadwal_sholat') }}
    </h3>
    <ul class="text-[length:var(--fs-body)]">
      @foreach ($jadwalSholat as $j)
      <li
        data-row
        data-next="false"
        class="flex justify-between rounded-[var(--radius-panel)] px-[var(--pad)] data-[next=true]:bg-[var(--c-highlight)] data-[next=true]:font-bold"
      >
        <span>{{ $j['nama'] }}</span>
        <span>{{ $j['waktu'] }}</span>
      </li>
      @endforeach
    </ul>
  </div>

  <!-- SLIDE AZAN (tidak ikut rotasi, hanya tampil pada mode azan) -->
  <div
    data-slide="azan"
    data-active="false"
    class="{{ $slide }} items-center text-center bg-[var(--c-azan-bg)]"
  >
    <p data-azan-menuju class="text-[length:var(--fs-body)]">
      {{ __('dashboard.azan_menuju') }}
    </p>
    <p data-azan-tiba class="hidden text-[length:var(--fs-body)]">
      {{ __('dashboard.azan_tiba') }}
    </p>

    <h3 data-azan-nama class="text-[length:var(--fs-title)] font-semibold"></h3>
    <p data-azan-waktu class="text-[length:var(--fs-body)]"></p>
    <p
      data-azan-countdown
      class="text-[length:var(--fs-countdown)] font-bold tabular-nums"
    ></p>
  </div>
</div>
```

Token `--fs-countdown` sudah ada di blok token (section 3).

### Script

```js
;(function () {
  const root = document.getElementById("panel-waktu")
  const tz = root.dataset.timezone
  const locale = document.documentElement.lang || "id-ID"
  const intervalMs = Number(root.dataset.interval) * 1000
  const before = Number(root.dataset.before) * 60 // detik
  const after = Number(root.dataset.after) * 60 // detik
  const jadwal = JSON.parse(root.dataset.jadwal || "[]")

  // Tanpa data jadwal: slide sholat dan mode azan dinonaktifkan
  if (!jadwal.length) root.querySelector('[data-slide="sholat"]')?.remove()

  const slides = [...root.querySelectorAll("[data-slide]")]
  const rotating = slides.filter((s) => s.dataset.slide !== "azan")
  const azanSlide = root.querySelector('[data-slide="azan"]')
  const rows = [...root.querySelectorAll("[data-row]")]
  const $ = (sel) => root.querySelector(sel)

  let mode = "carousel",
    index = 0,
    timer = null

  const show = (el) =>
    slides.forEach((s) => (s.dataset.active = String(s === el)))

  // Detik sejak tengah malam pada zona waktu yang dikonfigurasi
  function secondsNow() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hourCycle: "h23",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(new Date())
    const get = (t) => Number(parts.find((p) => p.type === t).value)
    return get("hour") * 3600 + get("minute") * 60 + get("second")
  }

  const toSec = (hhmm) => {
    const [h, m] = hhmm.split(":").map(Number)
    return h * 3600 + m * 60
  }
  const mmss = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

  // Jam, hari, tanggal
  function tickClock() {
    const now = new Date()
    const fmt = (o) =>
      new Intl.DateTimeFormat(locale, { timeZone: tz, ...o }).format(now)
    $("[data-day]").textContent = fmt({ weekday: "long" })
    $("[data-date]").textContent = fmt({
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    $("[data-clock]").textContent = fmt({
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
  }

  // Sholat yang sedang berada di jendela azan: [waktu - before, waktu + after)
  function activePrayer(now) {
    return (
      jadwal
        .map((j) => ({ ...j, at: toSec(j.waktu) }))
        .find((j) => now >= j.at - before && now < j.at + after) || null
    )
  }

  // Sorot sholat berikutnya pada slide jadwal (setelah sholat terakhir -> baris pertama)
  function markNext(now) {
    const next = jadwal.findIndex((j) => toSec(j.waktu) > now)
    rows.forEach(
      (r, i) => (r.dataset.next = String(i === (next === -1 ? 0 : next)))
    )
  }

  function renderAzan(p, now) {
    const diff = p.at - now
    $("[data-azan-nama]").textContent = p.nama
    $("[data-azan-waktu]").textContent = p.waktu
    $("[data-azan-menuju]").classList.toggle("hidden", diff <= 0)
    $("[data-azan-tiba]").classList.toggle("hidden", diff > 0)
    $("[data-azan-countdown]").textContent = diff > 0 ? mmss(diff) : ""
  }

  function startCarousel() {
    timer = setInterval(() => {
      index = (index + 1) % rotating.length
      show(rotating[index])
    }, intervalMs)
  }

  function update() {
    tickClock()
    const now = secondsNow()
    markNext(now)

    const p = activePrayer(now)
    if (p) {
      if (mode !== "azan") {
        // masuk mode azan
        mode = "azan"
        clearInterval(timer)
        show(azanSlide)
      }
      renderAzan(p, now)
    } else if (mode === "azan") {
      // keluar dari mode azan
      mode = "carousel"
      index = 0
      show(rotating[0])
      startCarousel()
    }
  }

  show(rotating[0])
  startCarousel()
  update()
  setInterval(update, 1000)
})()
```

Catatan perilaku:

- Jika halaman dimuat ulang saat berada di dalam jendela azan, panel langsung masuk mode azan.
- Perbandingan waktu memakai detik sejak tengah malam pada zona waktu yang dikonfigurasi, sehingga tidak bergantung pada zona waktu perangkat layar.
- Setelah sholat terakhir hari itu, baris pertama jadwal disorot sebagai sholat berikutnya. Untuk menampilkan jadwal besok secara akurat, muat ulang data jadwal saat pergantian hari.

### Panel Promo (Carousel)

Promo Bappeda berupa gambar **portrait** (infografis atau poster). Panel ini adalah carousel **horizontal** yang menggeser gambar satu per satu secara otomatis, **tanpa card** (tanpa border, latar panel atau header; gambar langsung mengisi sel grid). Jumlah promo per tampilan (default 1) dan interval dibaca dari konfigurasi.

Arah geser tetap horizontal; konfigurasi `promo_arah` dihapus.

Ketentuan:

- Gambar portrait memakai `object-contain` agar tidak terpotong.
- Jika jumlah promo kurang dari atau sama dengan jumlah per tampilan, carousel tidak berputar.
- Halaman terakhir dirapatkan ke ujung agar tidak ada ruang kosong ketika jumlah promo tidak habis dibagi jumlah per tampilan.
- Jika tidak ada promo aktif, tampilkan gambar cadangan dari konfigurasi.
- Pada implementasi, carousel memakai shadcn `Carousel` (embla) dengan `axis: x`.

```html
<div
  id="panel-promo"
  class="h-full min-h-0 overflow-hidden"
  data-interval="{{ config('dashboard.promo_detik') }}"
  data-per-view="{{ config('dashboard.promo_per_tampilan') }}"
  style="--per-view: {{ config('dashboard.promo_per_tampilan') }}"
>
  <div
    data-track
    class="flex h-full w-full flex-row transition-transform duration-700 ease-in-out"
  >
    @forelse ($promo as $p)
    <figure
      class="h-full w-[calc(100%/var(--per-view))] min-h-0 min-w-0 shrink-0 px-[calc(var(--gap)/2)]"
    >
      <img
        src="{{ $p->gambar_url }}"
        alt="{{ $p->judul }}"
        class="h-full w-full rounded-[var(--radius-panel)] object-contain"
      />
    </figure>
    @empty
    <figure class="h-full w-full shrink-0">
      <img
        src="{{ config('dashboard.promo_default') }}"
        alt=""
        class="h-full w-full rounded-[var(--radius-panel)] object-contain"
      />
    </figure>
    @endforelse
  </div>
</div>
```

```js
;(function () {
  const root = document.getElementById("panel-promo")
  const track = root.querySelector("[data-track]")
  const items = [...track.children]
  const perView = Number(root.dataset.perView)
  const interval = Number(root.dataset.interval) * 1000

  // Semua promo sudah muat dalam satu tampilan: tidak perlu berputar
  if (items.length <= perView) return

  const pages = Math.ceil(items.length / perView)
  let page = 0

  function go(p) {
    // Halaman terakhir dirapatkan agar tidak ada ruang kosong
    const offset = Math.min(p * perView, items.length - perView)
    const shift = (offset * 100) / perView // % terhadap ukuran panel
    track.style.transform = `translateX(-${shift}%)`
  }

  setInterval(() => {
    page = (page + 1) % pages
    go(page)
  }, interval)
})()
```

Mengganti item promo adalah urusan data (aktifkan/nonaktifkan promo dari admin, gambar berupa URL). Markup dan script tidak perlu diubah.

---

## 7. Kolom Tengah

Area visual utama. Pembagian tinggi mengikuti token `--rows-center` (default 64fr / 36fr).

```html
<section class="grid min-h-0 grid-rows-[var(--rows-center)] gap-[var(--gap)]">
  <!-- VIDEO -->
  <div class="min-h-0 overflow-hidden">...</div>

  <!-- PANDU -->
  <div class="min-h-0 overflow-hidden">...</div>
</section>
```

### Video

Gunakan `aspect-ratio` agar video tidak terdistorsi, dan jangan menentukan tinggi dengan pixel tetap. Sumber video diambil dari data/playlist.

```html
<div
  class="aspect-video max-h-full w-full overflow-hidden rounded-[var(--radius-panel)]"
>
  <video
    class="h-full w-full object-cover"
    src="{{ $video->url }}"
    autoplay
    muted
    loop
    playsinline
  ></video>
</div>
```

Untuk video 16:9 gunakan `aspect-video`; untuk rasio lain gunakan `aspect-[lebar/tinggi]` sesuai metadata media.

---

## 8. Panel PANDU

Area di bawah video untuk memperkenalkan **PANDU — Asisten Digital Bappeda**.

Informasi yang dapat ditampilkan:

- Logo/ikon PANDU
- Nama PANDU
- Deskripsi singkat
- Fungsi pencarian dokumen
- QR Code Telegram
- Username Telegram
- Ilustrasi penggunaan

Semua isi diambil dari data (mis. tabel/konfigurasi PANDU):

```html
<div class="flex h-full items-center gap-[var(--gap)] p-[var(--pad)]">
  <img
    src="{{ $pandu->logo_url }}"
    alt="{{ $pandu->nama }}"
    class="aspect-square w-[var(--icon)] object-contain"
  />

  <div class="min-w-0 flex-1">
    <h3 class="text-[length:var(--fs-title)] font-semibold">
      {{ $pandu->nama }}
    </h3>
    <p class="text-[length:var(--fs-body)]">{{ $pandu->deskripsi }}</p>
  </div>

  <div class="aspect-square h-full">
    <img
      src="{{ $pandu->qr_url }}"
      alt="QR Telegram"
      class="h-full w-full object-contain"
    />
    <p class="text-center text-[length:var(--fs-badge)]">
      {{ $pandu->telegram_username }}
    </p>
  </div>
</div>
```

Panel ini menggunakan layout internal flex/grid, bukan posisi absolut.

---

## 9. Kolom Kanan

Pembagian tinggi mengikuti token `--rows-right` (default 53fr / 47fr).

```html
<section class="grid min-h-0 grid-rows-[var(--rows-right)] gap-[var(--gap)]">
  <!-- PENGUMUMAN -->
  <div class="min-h-0 overflow-hidden">...</div>

  <!-- AGENDA -->
  <div class="min-h-0 overflow-hidden">...</div>
</section>
```

### Komponen Panel Scrollable

Pengumuman dan agenda dapat berisi data banyak atau panjang. Kedua panel memakai satu komponen yang sama dengan perilaku berikut:

- **Header panel tetap**, hanya daftar isi yang bergulir.
- Jika isi muat, tidak ada scroll dan tidak ada efek apa pun.
- Jika isi melebihi tinggi panel, daftar **bergulir otomatis** ke bawah, berhenti sejenak di ujung, lalu kembali ke atas dan mengulang.
- Layar bersifat pasif: tidak ada scroll manual, hanya auto-scroll.
- Scrollbar disembunyikan agar tampilan bersih. Efek pudar di tepi bawah menandakan masih ada konten.
- Kecepatan dinyatakan sebagai **fraksi tinggi panel per detik**, sehingga tetap proporsional di semua resolusi.

Prinsip "tanpa scroll" hanya berlaku untuk **layout utama**. Di dalam panel, hanya auto-scroll yang diperbolehkan.

Token efek pudar (tambahkan pada blok token section 3):

```css
:root {
  --fade-mask: linear-gradient(to bottom, black 88%, transparent);
}
```

Komponen Blade:

```blade
{{-- resources/views/components/autoscroll.blade.php --}}
<div data-autoscroll
     data-speed="{{ config('dashboard.scroll_kecepatan') }}"
     data-pause="{{ config('dashboard.scroll_jeda_detik') }}"
     {{ $attributes->merge(['class' => 'flex-1 min-h-0 overflow-y-auto overscroll-contain
        [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
        data-[overflow=true]:[mask-image:var(--fade-mask)]']) }}>
    {{ $slot }}
</div>
```

Script:

```js
document.querySelectorAll("[data-autoscroll]").forEach((el) => {
  const speed = Number(el.dataset.speed) // fraksi tinggi panel per detik
  const pause = Number(el.dataset.pause) * 1000 // jeda di atas dan di bawah

  let pos = 0,
    last = null,
    atEnd = false
  let holdUntil = performance.now() + pause

  const max = () => el.scrollHeight - el.clientHeight
  const overflowing = () => max() > 1

  function refresh() {
    el.dataset.overflow = String(overflowing())
    if (!overflowing()) {
      el.scrollTop = 0
      pos = 0
    }
  }

  function frame(t) {
    if (last === null) last = t
    const dt = Math.min((t - last) / 1000, 0.1)
    last = t

    if (overflowing() && t >= holdUntil) {
      if (atEnd) {
        // sudah jeda di bawah: kembali ke atas
        pos = 0
        atEnd = false
        holdUntil = t + pause
      } else {
        pos = Math.min(pos + speed * el.clientHeight * dt, max())
        if (pos >= max()) {
          atEnd = true
          holdUntil = t + pause
        }
      }
      el.scrollTop = pos
    }
    requestAnimationFrame(frame)
  }

  // Hitung ulang saat ukuran panel atau isi berubah (data bertambah, resize layar)
  const ro = new ResizeObserver(refresh)
  ro.observe(el)
  if (el.firstElementChild) ro.observe(el.firstElementChild)

  refresh()
  requestAnimationFrame(frame)
})
```

---

## 10. Panel Pengumuman

Menampilkan daftar pengumuman dengan jumlah berapa pun. Panel memakai komponen scrollable (section 9): bergulir otomatis jika isi melebihi tinggi panel.

Setiap item dapat berisi:

- Icon kategori
- Judul (boleh panjang, otomatis membungkus ke beberapa baris)
- Tanggal

```html
<div class="flex h-full flex-col">
  <header class="flex shrink-0 items-center justify-between p-[var(--pad)]">
    <h2 class="text-[length:var(--fs-title)] font-semibold">
      {{ __('dashboard.pengumuman') }}
    </h2>
  </header>

  <x-autoscroll>
    <ul class="divide-y divide-[var(--c-border)]">
      @foreach ($pengumuman as $item)
      <li class="flex items-start gap-[var(--gap)] p-[var(--pad)]">
        <span
          class="aspect-square w-[var(--icon)] shrink-0 rounded-[var(--radius-panel)]"
          style="background: {{ $item->kategori->warna }}"
        ></span>
        <div class="min-w-0">
          <h3 class="text-[length:var(--fs-title)] font-semibold">
            {{ $item->judul }}
          </h3>
          <p class="text-[length:var(--fs-body)]">
            {{ $item->tanggal->translatedFormat('d M Y') }}
          </p>
        </div>
      </li>
      @endforeach
    </ul>
  </x-autoscroll>
</div>
```

Tampilan konseptual:

```text
┌─────────────────────────────────────┐
│ 📢  {judul panel}                   │  ← header tetap
├─────────────────────────────────────┤
│ {icon}  {judul pengumuman}          │ ┐
│         {tanggal}                   │ │
├─────────────────────────────────────┤ │ area bergulir
│ {icon}  {judul pengumuman}          │ │
│         {tanggal}                   │ ┘
└─────────────────────────────────────┘
```

Judul yang terlalu panjang tetap ditampilkan utuh karena panel dapat bergulir. Jika ingin membatasi, gunakan `line-clamp-*` pada judul.

---

## 11. Panel Agenda

Menampilkan kegiatan pada hari berjalan, diambil dari data agenda yang difilter berdasarkan tanggal hari ini. Sama seperti pengumuman, panel memakai komponen scrollable (section 9), sehingga agenda yang banyak atau panjang tetap terbaca seluruhnya.

```html
<div class="flex h-full flex-col">
  <header class="flex shrink-0 items-center justify-between p-[var(--pad)]">
    <h2 class="text-[length:var(--fs-title)] font-semibold">
      {{ __('dashboard.agenda_hari_ini') }}
    </h2>
  </header>

  <x-autoscroll>
    <ul class="divide-y divide-[var(--c-border)]">
      @forelse ($agenda as $item)
      <li class="p-[var(--pad)]">
        <span
          class="inline-block rounded-full bg-[var(--c-badge)] px-[var(--pad)] text-[length:var(--fs-badge)]"
        >
          {{ $item->mulai->format('H:i') }}–{{ $item->selesai->format('H:i') }}
        </span>
        <p class="text-[length:var(--fs-body)] font-medium">
          {{ $item->judul }}
        </p>
        <p class="text-[length:var(--fs-badge)]">📍 {{ $item->lokasi }}</p>
      </li>
      @empty
      <li class="p-[var(--pad)] text-[length:var(--fs-body)]">
        {{ __('dashboard.agenda_kosong') }}
      </li>
      @endforelse
    </ul>
  </x-autoscroll>
</div>
```

Tampilan konseptual:

```text
┌─────────────────────────────────────┐
│ 📅  {judul panel}                   │  ← header tetap
├─────────────────────────────────────┤
│ {mulai}–{selesai}                   │ ┐
│ {judul kegiatan}                    │ │ area bergulir
│ 📍 {lokasi}                         │ ┘
└─────────────────────────────────────┘
```

---

## 12. Running Text

Menggunakan **5% tinggi layar** (token `--rows-screen`), untuk informasi yang:

- singkat
- penting
- berubah secara berkala
- tidak membutuhkan panel khusus

Isi berasal dari data (mis. daftar pesan aktif), dipisahkan dengan pemisah visual:

```html
<div class="flex min-h-0 items-center overflow-hidden">
  <div class="marquee text-[length:var(--fs-body)] whitespace-nowrap">
    @foreach ($runningText as $pesan)
    <span>{{ $pesan->isi }}</span>
    @unless ($loop->last)<span class="mx-[var(--gap)]">•</span>@endunless
    @endforeach
  </div>
</div>
```

Running text sebaiknya tidak lebih dari satu baris.

---

## 13. Sistem Ukuran Responsif

Jangan menggunakan pixel tetap. Gunakan aturan berikut:

| Komponen            | Metode                                               |
| ------------------- | ---------------------------------------------------- |
| Tinggi layout utama | `%` (token `--rows-screen`)                          |
| Pembagian kolom     | `fr` (token `--cols-main`)                           |
| Pembagian panel     | `fr` (token `--rows-*`)                              |
| Video               | `aspect-ratio`                                       |
| Gambar              | `aspect-ratio` + `object-contain`                    |
| Font                | `clamp()` (token `--fs-*`)                           |
| Icon                | `clamp()` (token `--icon`)                           |
| Padding             | `clamp()` (token `--pad`)                            |
| Gap                 | `clamp()` (token `--gap`)                            |
| Border radius       | `clamp()` (token `--radius-panel`)                   |
| Warna               | variable (token `--c-*`)                             |
| Container           | `%` + `min-h-0`                                      |
| Konten berlebih     | Scroll internal panel (auto-scroll); promo: carousel |
| Scroll utama        | Hindari                                              |

### Contoh penerapan

Hindari:

```html
<span class="text-[32px]">...</span>
<img class="h-8 w-8" ... />
<div class="rounded-lg p-4">...</div>
```

Gunakan:

```html
<span class="text-[length:var(--fs-clock)]">...</span>
<img class="aspect-square w-[var(--icon)]" ... />
<div class="rounded-[var(--radius-panel)] p-[var(--pad)]">...</div>
```

Dengan token, panel tidak terlalu padat di layar kecil dan tidak terlalu renggang di layar besar.

---

## 14. Penting: `min-h-0`

Setiap container Grid/Flex dengan konten dinamis sebaiknya memakai `min-h-0`:

```html
<section class="grid min-h-0 grid-rows-[var(--rows-right)]"></section>
```

Tujuannya agar konten anak tidak memaksa parent menjadi lebih tinggi dan menyebabkan overflow.

---

## 15. Hindari Absolute Positioning untuk Layout Utama

Hindari:

```html
<div class="absolute top-[...] left-[...]"></div>
```

untuk menentukan posisi panel utama. Gunakan CSS Grid, Flexbox, `fr`, `%`, dan `aspect-ratio`.

`absolute` masih boleh dipakai untuk elemen dekoratif atau overlay, misalnya:

- play button video
- gradient pada gambar
- badge
- icon overlay

---

## 16. Prinsip Utama

> **Gunakan `%` untuk proporsi, `fr` untuk pembagian ruang, `aspect-ratio` untuk media, dan `clamp()` untuk ukuran yang mengikuti layar. Definisikan semuanya sebagai token, dan ambil semua konten dari data.**

Dengan pendekatan ini layout tidak bergantung pada resolusi tertentu, sehingga dapat digunakan pada layar seperti 1366×768, 1600×900, 1920×1080, 2560×1440, dan 3840×2160, selama rasio layar mendekati **16:9**.

Untuk rasio berbeda (16:10, 21:9, atau portrait), override token pada breakpoint/media query khusus sebagai fallback:

```css
@media (max-aspect-ratio: 4/3) {
  :root {
    --cols-main: 1fr;
    /* sesuaikan token lain untuk layout portrait */
  }
}
```
