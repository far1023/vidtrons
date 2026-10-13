# SPEC: Layar Informasi Lobby Bappeda

Design and behavior reference: `docs/LAYOUT.md` (legacy plan, updated to match this file). Visual style: `docs/DESIGN.md`. Where documents disagree, this file wins over LAYOUT.md, and LAYOUT.md wins over DESIGN.md for layout and sizing.

## Goal

Show up-to-date information on the lobby TV, with staff managing content from an admin panel. The TV is passive (no touch, no mouse).

## Decisions (confirmed)

- Faithful port of the layout plan: Blade becomes React components, vanilla scripts become hooks, `config/dashboard.php` becomes env values plus `lib/config.ts`.
- All UI is built on shadcn/ui components wherever shadcn has an equivalent; each component is added with the shadcn CLI before use. The display grid (`DisplayScreen`) and behaviors with no shadcn equivalent (clock, autoscroll, prayer mode, marquee, crossfade slide stack) are custom, composed from shadcn primitives and the design tokens. See `docs/COMPONENTS.md` for the mapping.
- `--radius` is reserved by shadcn; the panel radius token is `--radius-panel`.
- Color tokens (`--c-*`) are added so no raw palette colors are used on the display. Values come from `docs/DESIGN.md` (emerald theme), mapped in LAYOUT.md section 3.
- Row tokens `--rows-left/center/right` use `fr` instead of percentages (LAYOUT.md updated), because percentage rows plus `gap` overflow the column by one gap.
- Own database (Drizzle ORM + PostgreSQL on Neon; Drizzle is the only ORM, and Drizzle Studio is the development database browser) for announcements, agenda, promo, running text, video and PANDU. Prayer times and weather come from external APIs fetched by the browser on initial page load.
- Passive display: no "Lihat" cue and no manual-scroll interruption (removed from LAYOUT.md).
- Prayer times and weather are fetched once, on initial page load, directly from the third-party APIs (AlAdhan and Open-Meteo; see `docs/DATA-SOURCES.md`). They are not part of the 60-second polling and there is no server proxy. A failed load retries with backoff, and the last good result is kept in localStorage.
- Location is hard-coded: Kota Dumai, latitude 1.66711, longitude 101.44316, defined once in `lib/location.ts` and used for prayer times, weather and the weather slide's city label. This is a deliberate exception to the "no hard-coded values" principle; LAYOUT.md states the same exception and no longer has a `kota` config. The timezone stays in env.
- Video keeps `aspect-video` + `object-cover` (small edge crop accepted).
- Media is uploaded elsewhere; the admin only enters URLs, which are stored in the database. The app never stores files.
- Layout is built as a component skeleton first (see `docs/COMPONENTS.md`); data, behavior and admin come after the skeleton is verified on screen.
- Deployment: Vercel (Next.js) + Neon. Consequences: no local disk (so the app has no uploads), server runs in UTC (all dates use the configured timezone), and database access must be cached (see API).

## Display page (`/display`, public)

Layout, tokens and panel behavior exactly as in `docs/LAYOUT.md`:

1. **Header (10%)**: logo, instansi name, slogan (from `Setting`).
2. **Waktu panel (left top)**: carousel Jam, Cuaca, Jadwal Sholat; switches to the Azan slide from N minutes before to M minutes after a prayer time; returns to the carousel afterwards. Slides with no data are removed (no prayer data disables sholat slide and azan mode).
3. **Promo (left bottom)**: horizontal carousel of portrait images, no card (no border, header or panel background); `promo_per_tampilan` items per view (default 1), static if items fit one view, fallback image when empty.
4. **Video (center top)**: playlist, muted autoplay.
5. **PANDU panel (center bottom)**: logo, name, description, QR Telegram, username.
6. **Pengumuman (right top)** and **Agenda (right bottom)**: fixed header, auto-scrolling list (pause at top/bottom, loop, fade mask, speed as panel-height fraction per second). Agenda shows only today's items (configured timezone).
7. **Running text (5%)**: one line, active messages separated by a bullet.

Data refresh: SWR polls `/api/display` every 60 seconds (database content only). Prayer times and weather are fetched once on initial page load and are not polled; the last good data is kept if a request fails.

## Admin panel (`/admin`, login required)

No file uploads: media fields (promo image, video, PANDU logo and QR, instansi logo) are URL fields, validated as `https` links to direct files, with a live preview in the form. CRUD (create, edit, delete, activate/deactivate) for: Pengumuman (with Kategori), Agenda, Promo (image URL, order), Running text, Video playlist (URL, order), PANDU (singleton), Pengaturan (instansi name, slogan, logo). A "Buka layar" button opens `/display` in a new tab.

## Data model (draft)

- `Kategori`: id, nama, warna
- `Pengumuman`: id, judul, tanggal, kategoriId, isActive
- `Agenda`: id, judul, tanggal, mulai, selesai, lokasi, isActive
- `Promo`: id, judul, gambarUrl, urutan, isActive
- `RunningText`: id, isi, isActive
- `Video`: id, judul, url, urutan, isActive
- `Pandu` (single row): nama, deskripsi, logoUrl, qrUrl, telegramUsername
- `Setting`: key, value (namaInstansi, slogan, logoUrl)
- `User`: id, email, passwordHash

## Config (env, typed in `lib/config.ts`)

`DASHBOARD_TIMEZONE`, `DASHBOARD_TIMEZONE_LABEL`, `DASHBOARD_CAROUSEL_DETIK` (10), `DASHBOARD_AZAN_SEBELUM_MENIT` (10), `DASHBOARD_AZAN_SESUDAH_MENIT` (5), `DASHBOARD_PROMO_DETIK` (8), `DASHBOARD_PROMO_PER_TAMPILAN` (1), `DASHBOARD_PROMO_DEFAULT`, `DASHBOARD_SCROLL_KECEPATAN` (0.06), `DASHBOARD_SCROLL_JEDA_DETIK` (3).
(`scroll_lanjut_detik` is dropped because the display is passive.)

## API

- `GET /api/display` (public): active pengumuman, today's agenda, promo, running text, videos, PANDU, settings. Served from the Next.js cache (tagged; cache key includes today's date in the config timezone) and revalidated with `revalidateTag` when the admin saves changes, so the 60-second polling does not wake the Neon database.
- No `/api/sholat` or `/api/cuaca`: the browser calls AlAdhan and Open-Meteo directly on initial page load (see `docs/DATA-SOURCES.md`).
- Admin CRUD via route handlers only (REST), structured in layers as defined in `docs/BACKEND.md`; no server actions. Protected by the session (`with-auth`).

## Out of scope (v1)

Touch interaction, multiple screens/playlists, multiple user roles, websockets, non-16:9 layouts beyond the media-query fallback in LAYOUT.md.

## Open questions

- Vercel plan: the Hobby plan is restricted to personal, non-commercial use. Confirm whether a government agency deployment qualifies, or whether Pro is needed.
- Where media will be hosted: it must give direct, stable `https` links with no hotlink blocking. Google Drive share links usually open a viewer page instead of the file, so test each host with a sample image and video.
- Neon plan: free compute hours vs always-awake polling (the caching rule above is meant to keep usage low).
- Staleness (pending approval): with one fetch on initial page load, prayer times and weather stay frozen until the page reloads. Prayer times drift slowly near the equator but still shift over weeks; weather would be hours old. Proposed: reload the whole page once a day shortly after midnight in the configured timezone (re-runs the initial-load fetch and clears long-running memory). Optional: a slow weather refresh (for example every 30 to 60 minutes) instead of none. Until decided, fetch on initial load only.
- AlAdhan `method=11`: as far as I know AlAdhan lists 11 as Singapore (MUIS) and 20 as Kementerian Agama RI. Confirm which is intended via `https://api.aladhan.com/v1/methods`, and compare the output with the official Dumai schedule before going live.
- CORS: both APIs are expected to allow browser calls; verify in T11. If blocked, ask the user before adding a server proxy.
- Check the terms of use and rate limits of the free AlAdhan and Open-Meteo APIs for this use.
- Color token values and fonts: the mapping from `docs/DESIGN.md` is proposed in LAYOUT.md section 3 and the user approves it in T2, including whether the header and running text use the dark emerald band, which free fonts replace the proprietary ones, and whether the admin panel's shadcn theme uses the emerald palette.
