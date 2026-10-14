# PROGRESS

## Status

T1 to T15 done. Login & Admin Layout completed! Next task: T16 (Admin CRUD: Pengumuman + Kategori, Agenda, Running Text).

## Log

- Setup: AGENTS.md (replaces CLAUDE.md), SPEC.md, COMPONENTS.md, BACKEND.md, DATA-SOURCES.md, DESIGN.md, LAYOUT.md, TASKS.md, PROGRESS.md in place. Layout skeleton (T1 to T5) now comes before any data work.
- Rule added: all UI is built on shadcn/ui; when shadcn has a component, add it with the CLI first. List of shadcn components added so far: `button` (preinstalled), `card`, `avatar`, `aspect-ratio`, `badge`, `separator`, `carousel` (added via CLI in T3/T4; `badge` and `separator` are installed but not used yet), `scroll-area` (added in T9).
- Docs recheck: LAYOUT.md updated (passive display, `fr` row tokens, `--radius-panel`, color tokens from DESIGN.md, hard-coded location, config table, AlAdhan source). Precedence and Design system rules added to AGENTS.md.
- T1: size tokens added to `app/globals.css` (`fr` row tokens, `--radius-panel`, `--fs-countdown`, `--fade-mask`); `--radius` untouched.
- T2: user approved the emerald palette, dark emerald band for header and running text, fonts kept as Roboto + Inter, and mapping shadcn color variables to emerald (light theme only; `.dark` block untouched). `--c-*` tokens added.
- T3/T4: `lib/labels.ts`, `components/display/` (`panel`, `display-screen`, 8 panels), route `app/(display)/display/page.tsx`. Panels use shadcn Card, Avatar, AspectRatio, Carousel.
- T5: approved by the user. Layout verified without page scrollbars or panel overlap. Fixed PANDU QR overflow & avatar fallback styling.
- Perubahan promo (instruksi user): PromoPanel diubah menjadi carousel horizontal tanpa card/border panel (gambar portrait mengisi sel grid langsung dengan object-contain, per-view default 1). Diperbarui di docs/LAYOUT.md, docs/SPEC.md, docs/COMPONENTS.md, docs/TASKS.md, dan components/display/promo-panel.tsx.
- T6: Drizzle ORM setup completed. Installed `drizzle-orm`, `@neondatabase/serverless`, `pg`, `@types/pg`, `server-only`, `zod`, `bcryptjs`, `drizzle-kit`, `dotenv`, `tsx`. Implemented dual-driver support via `db/client.ts` (`node-postgres` for local Postgres dev, `neon-http` for Neon production/dev branch). Schema in `db/schema.ts` (9 tables), `db/index.ts`, `drizzle.config.ts`, `db/seed.ts`. Generated initial migration and successfully applied it via `npm run db:migrate`. Seeded initial sample data (`npm run db:seed`) including default admin credentials (`admin@example.com` / `admin`). Verified row counts. Verified `npm run db:studio` runs and connects properly. `npm run build` passes.
- T6A: Backend foundation and reference entity `running-text` implemented end to end per `docs/BACKEND.md`.
  - Added `lib/constants.ts` with `DISPLAY_CACHE_TAG = "display-feed"`.
  - Added `server/errors/app-error.ts` (`AppError`, `ValidationError` with field errors, `NotFoundError`, `UnauthorizedError`).
  - Added `server/http/response.ts` (`ok`, `created`, `noContent`, `errorResponse` with generic 500 fallback).
  - Added `server/middleware/with-handler.ts` (catches errors and formats JSON response) and `server/middleware/with-auth.ts` (default deny returning 401 until T15, with dev test support).
  - Added `lib/schemas/running-text.schema.ts` (pure Zod schemas for store, update, and id param).
  - Added `server/models/running-text.model.ts` (Drizzle queries: `all`, `active`, `find`, `create`, `update`, `remove`).
  - Added `server/resources/running-text.resource.ts` (`toRunningTextResource`, `toRunningTextCollection` with ISO date strings).
  - Added `server/services/cache.ts` (`revalidateDisplayCache` with safe store handling) and `server/services/running-text.service.ts` (business logic + display cache tag invalidation on writes).
  - Added `server/requests/running-text.request.ts` (async route params parsing, body validation).
  - Added `server/controllers/running-text.controller.ts` (resource controller methods: `index`, `show`, `store`, `update`, `destroy`).
  - Added thin route handlers `app/api/admin/running-text/route.ts` and `app/api/admin/running-text/[id]/route.ts`.
  - Added `server/requests/base.ts` as a reusable request helper library (`validateJson`, `validateIdParam`, `validateRouteParam`, `validateQueryParams`, `formatZodIssues`) so URL parameters on GET/DELETE/PATCH are validated directly via `validateIdParam` in the controller, while request body schemas stay pure and consistent across all entities without boilerplate.
  - Verified all 10 endpoint test cases: unauthenticated 401, authenticated index 200, store validation error 422, store valid 201, show 200, unknown id 404, invalid id 422, update 200, destroy 204, show after delete 404.
  - Verified `npm run build` and `npm run typecheck` pass with 0 errors.
- T7: `GET /api/display` feed with tagged Next.js caching + SWR polling hook.
  - Added typed config & timezone helpers in `lib/config.ts` (`DASHBOARD_TIMEZONE`, `getTodayDateString`, `getSecondsSinceMidnight`).
  - Added shared data contracts in `types/display.ts` (`DisplayFeedData`).
  - Added model query functions in `server/models/setting.model.ts`, `pengumuman.model.ts`, `agenda.model.ts`, `promo.model.ts`, `video.model.ts`, `pandu.model.ts`.
  - Added `server/resources/display.resource.ts`, `server/services/display.service.ts` (with `unstable_cache` keyed by timezone date and tagged `display-feed`), `server/controllers/display.controller.ts`, and `app/api/display/route.ts`.
  - Added `hooks/use-display-data.ts` using SWR (60-second polling interval, memory fallback, `localStorage` caching fallback so screen never goes blank).
- T8: Connected `HeaderBar` (instansi, slogan, logo) and `RunningText` to real data. Added smooth infinite CSS `@keyframes marquee` animation loop in `app/globals.css` and updated `components/display/running-text.tsx` with duplicate track looping.
- T9: Installed shadcn `scroll-area`. Created `hooks/use-autoscroll.ts` and `components/display/autoscroll.tsx` with bottom fade mask (`--fade-mask`), speed/pause from config, and full cleanup of `ResizeObserver` & `requestAnimationFrame`. Implemented `PengumumanPanel` and `AgendaPanel` with auto-scrolling lists, category indicators, time badges, location pins, and empty state fallbacks.
- T10: Implemented `PromoPanel` behavior using shadcn `Carousel` (Embla). Configured horizontal orientation, portrait image layout with `object-contain`, automatic interval looping based on `config.promoDetik`, loop option, fallback placeholder on error or empty state, and proper timer cleanup on unmount.
- T11: Prayer times and weather data layer implemented per `docs/DATA-SOURCES.md`.
  - Created `lib/location.ts` with hard-coded Kota Dumai constants (1.66711, 101.44316).
  - Created `lib/data-sources.ts` with AlAdhan prayer timings URL builder, Open-Meteo forecast URL builder, and prayer parser mapping Subuh, Dzuhur, Ashar, Maghrib, Isya with minute adjustment support.
  - Created `lib/weather-code.ts` with full WMO code lookup to Indonesian labels and day/night Lucide icons (`Sun`, `Moon`, `CloudSun`, `CloudMoon`, `Cloud`, `CloudFog`, `CloudDrizzle`, `CloudRain`, `CloudRainWind`, `CloudSnow`, `CloudLightning`, `CloudHail`).
  - Created `hooks/use-prayer-weather.ts` client hook executing parallel browser fetches on mount, exponential retry backoff on failure (30s, 1m, 5m), `localStorage` fallbacks, and timer cleanups on unmount.
  - Verified CORS via live requests against both APIs (succeeded). Verified AlAdhan Method 11 (MUIS) and Method 20 (Kemenag) for Dumai coordinates (both yield identical prayer times).
- T12: Implemented complete `WaktuPanel` carousel & prayer mode per `docs/LAYOUT.md`.
  - Created `hooks/use-clock.ts` providing 1-second live clock, Indonesian day and date, and seconds-since-midnight.
  - Created `hooks/use-prayer-mode.ts` computing azan window `[prayer.at - before, prayer.at + after)`, active prayer countdown (`mm:ss`), azan arrival state, and next prayer index for schedule highlighting.
  - Implemented `components/display/waktu-panel.tsx` with crossfade slide stack:
    1. Jam slide (day, date, time with timezone label).
    2. Cuaca slide (city, temperature, condition label, Lucide icon).
    3. Jadwal Sholat slide (5 daily prayers with highlighted next upcoming prayer).
    4. Azan slide (overrides carousel when active: displays countdown when approaching azan, displays alert message when azan has arrived).
  - Proper timer cleanups on unmount for 24/7 stability.
- T13: Implemented `VideoPanel` with playlist support, muted autoplay (`autoPlay`, `muted`, `playsInline`), automatic progression on video end (`onEnded`), broken video skip handling (`onError`), and 16:9 `aspect-video` + `object-cover`.
- T14: Connected `PanduPanel` to real database feed (logo URL, service name, description, QR code URL, and Telegram username with proper image error fallbacks).
- T15: Auth.js login and Admin Layout implemented with shadcn blocks `login-04` and `dashboard-01`.
  - Added NextAuth options in `lib/auth.ts` with CredentialsProvider validating against `user` table (email and `bcryptjs` password verification). Added route handler `app/api/auth/[...nextauth]/route.ts`.
  - Added `proxy.ts` (Next.js middleware) protecting `/admin/:path*` (redirecting unauthenticated requests to `/login?callbackUrl=/admin`) without database client import.
  - Wired token verification into `server/middleware/with-auth.ts`: decodes NextAuth JWT session from request cookies or Authorization header; returns 401 Unauthorized (`Sesi admin tidak valid atau belum masuk`) when missing or invalid.
  - Configured `NEXTAUTH_SECRET` and `NEXTAUTH_URL` in `.env.local` and `.env.example`.
  - Implemented `app/login/page.tsx` and updated `components/login-form.tsx` using `login-04`: wired to NextAuth credentials `signIn`, error message display, loading state, redirection to `/admin`, and customized Bappeda Dumai visual theme.
  - Verified: unauthenticated API calls return 401, authenticated calls return 200, valid credentials (`admin@example.com` / `admin`) log in and issue session cookie, invalid credentials return error, unauthenticated page access redirects to `/login`, and `npm run build` passes with zero errors.
- T16 (Running Text CRUD):
  - Installed shadcn components via CLI: `dialog`, `textarea`, `switch`, `alert-dialog`.
  - Mounted `<Toaster richColors position="bottom-right" />` in `app/layout.tsx`.
  - Replicated single page CRUD architecture from `docs/LEGACY-CRUD.md` for running texts:
    - `components/admin/running-texts/running-texts-table.tsx`: TanStack Table, smart pagination with ellipsis, instant client-side filtering (search query and status select), reload button, and action dropdown menu.
    - `components/admin/running-texts/add-running-text-dialog.tsx`: Add modal dialog, character counter (max 500), switch for `isActive`, schema validation (`createRunningTextSchema`), server error mapping, and Sonner toast.
    - `components/admin/running-texts/edit-running-text-dialog.tsx`: Edit modal dialog pre-filled with selected item, validation (`updateRunningTextSchema`), server error mapping, and Sonner toast.
    - `components/admin/running-texts/delete-running-text-dialog.tsx`: Alert dialog confirmation with quoted text, destructive button, and Sonner warning toast.
    - Direct and clean header implementation in `app/(admin)/running-texts/page.tsx` with `SidebarTrigger`, `Separator`, and page title without overengineered abstractions; restored simple `components/site-header.tsx`.
    - Migrated route structure to Route Group `app/(admin)`: shared admin layout at `app/(admin)/layout.tsx`, dashboard at `/dashboard` (`app/(admin)/dashboard/page.tsx`), and running texts at `/running-texts` (`app/(admin)/running-texts/page.tsx`).
  - Cleaned up legacy `/admin` routes: deleted redundant `app/(admin)/admin` subfolder and redirects, removed `/admin` matchers from `proxy.ts`, updated `app-sidebar.tsx` active path check to `/dashboard`, leaving direct clean URLs `/dashboard` and `/running-texts`.
  - Renamed route group folder from `app/(admin)` to `app/(panels)`.
  - Installed shadcn `calendar` and `popover` components via CLI.
  - Implemented complete backend layers for `kategori`, `pengumuman`, and `agenda`:
    - Schemas: `lib/schemas/kategori.schema.ts`, `lib/schemas/pengumuman.schema.ts`, `lib/schemas/agenda.schema.ts`.
    - Models: `server/models/kategori.model.ts`, expanded `server/models/pengumuman.model.ts` (with `kategori` join) and `server/models/agenda.model.ts`.
    - Requests: `server/requests/kategori.request.ts`, `server/requests/pengumuman.request.ts`, `server/requests/agenda.request.ts`.
    - Resources: `server/resources/kategori.resource.ts`, `server/resources/pengumuman.resource.ts`, `server/resources/agenda.resource.ts`.
    - Services: `server/services/kategori.service.ts`, `server/services/pengumuman.service.ts`, `server/services/agenda.service.ts` (all wired to `revalidateDisplayCache()`).
    - Controllers: `server/controllers/kategori.controller.ts`, `server/controllers/pengumuman.controller.ts`, `server/controllers/agenda.controller.ts`.
    - Routes: `/api/admin/kategori`, `/api/admin/kategori/[id]`, `/api/admin/pengumuman`, `/api/admin/pengumuman/[id]`, `/api/admin/agenda`, `/api/admin/agenda/[id]`.
  - Built frontend tables and modal dialogs:
    - Pengumuman: `components/datatables/pengumuman-table.tsx`, `components/forms/pengumuman/add-pengumuman-dialog.tsx`, `components/forms/pengumuman/edit-pengumuman-dialog.tsx`, `components/forms/pengumuman/delete-pengumuman-dialog.tsx`, and `components/forms/pengumuman/manage-kategori-dialog.tsx`.
    - Agenda: `components/datatables/agenda-table.tsx`, `components/forms/agenda/add-agenda-dialog.tsx`, `components/forms/agenda/edit-agenda-dialog.tsx`, `components/forms/agenda/delete-agenda-dialog.tsx`.
    - Pages: `app/(panels)/pengumuman/page.tsx` and `app/(panels)/agenda/page.tsx`.
  - Updated `components/app-sidebar.tsx` with Pengumuman and Agenda menu items; protected `/pengumuman` and `/agenda` in `proxy.ts`.
  - Added `components/top-loading-bar.tsx` and mounted it in `app/(panels)/layout.tsx` to provide instant top loading bar feedback upon menu navigation clicks.
  - Added `app/(panels)/loading.tsx` skeleton fallback for Next.js App Router route transitions.
  - Standardized and harmonized `components/datatables/pengumuman-table.tsx` and `components/datatables/agenda-table.tsx` to match the reference structure, classes, and layout of `components/datatables/running-texts-table.tsx` exactly (header bar, table container, column definitions, action dropdowns, and smart pagination buttons).
  - Harmonized typography and spacing across all 3 datatables: page title standardized to `text-2xl font-bold tracking-tight`, sub-title to `text-sm text-muted-foreground`, header alignment set to `sm:items-start`, and filter bar top margin unified to `mt-6`.
  - Fixed vertical alignment of status and category pill labels across all datatables by applying `py-0 leading-none` and standardizing fallback category ("Umum") to a badge.
  - Recreated `components/datatables/running-texts-table.tsx` and `app/(panels)/running-texts/page.tsx` fully matching the standardized structure, formatting, typography, vertical alignment, and layout of Agenda and Pengumuman.
  - Verified `npx tsc --noEmit` and `npm run build` pass with 0 errors.
- T17 (Promo, Video, PANDU, and Pengaturan Admin CRUD):
  - Built complete backend layers (`docs/BACKEND.md`) for:
    - Promo (`promo`): `lib/schemas/promo.schema.ts`, `server/models/promo.model.ts`, `server/requests/promo.request.ts`, `server/resources/promo.resource.ts`, `server/services/promo.service.ts` (with `revalidateDisplayCache()`), `server/controllers/promo.controller.ts`, routes `app/api/admin/promo/route.ts` & `[id]/route.ts`.
    - Video (`video`): `lib/schemas/video.schema.ts`, `server/models/video.model.ts`, `server/requests/video.request.ts`, `server/resources/video.resource.ts`, `server/services/video.service.ts` (with `revalidateDisplayCache()`), `server/controllers/video.controller.ts`, routes `app/api/admin/video/route.ts` & `[id]/route.ts`.
    - PANDU singleton (`pandu` id=1): `lib/schemas/pandu.schema.ts`, `server/models/pandu.model.ts` (singleton upsert), `server/requests/pandu.request.ts`, `server/resources/pandu.resource.ts`, `server/services/pandu.service.ts` (with `revalidateDisplayCache()`), `server/controllers/pandu.controller.ts`, route `app/api/admin/pandu/route.ts`.
    - Pengaturan key-value (`setting`): `lib/schemas/setting.schema.ts`, `server/models/setting.model.ts` (`setMany` upsert), `server/requests/setting.request.ts`, `server/resources/setting.resource.ts`, `server/services/setting.service.ts` (with `revalidateDisplayCache()`), `server/controllers/setting.controller.ts`, route `app/api/admin/setting/route.ts`.
  - Added URL validation requiring HTTPS (`https://`) across all media inputs (image for Promo, MP4/video for Video, logo & QR for PANDU, logo for Pengaturan).
  - Built frontend forms, modals, tables, and pages:
    - Promo: `components/datatables/promo-table.tsx` with thumbnail preview, `components/forms/promo/add-promo-dialog.tsx`, `edit-promo-dialog.tsx`, `delete-promo-dialog.tsx`, and `app/(panels)/promo/page.tsx`.
    - Video: `components/datatables/video-table.tsx`, `components/forms/video/add-video-dialog.tsx`, `edit-video-dialog.tsx` (with live `<video>` preview), `delete-video-dialog.tsx`, and `app/(panels)/video/page.tsx`.
    - PANDU: `components/forms/pandu/pandu-form.tsx` (with live videotron panel simulation preview for logo, description, QR code, and Telegram username) and `app/(panels)/pandu/page.tsx`.
    - Pengaturan: `components/forms/setting/setting-form.tsx` (with live header simulation preview and "Buka Layar Videotron" button to `/display` in a new tab) and `app/(panels)/pengaturan/page.tsx`.
  - Updated `components/app-sidebar.tsx` with navigation links to Promo, Video, PANDU, and Pengaturan.
  - Protected all new routes in `proxy.ts`.
  - Verified compilation: `npx tsc --noEmit` and `npm run build` completed with 0 errors.
- Refaktor Komponen Datatable:
  - Dibuat komponen reusable generik `components/datatables/data-table.tsx` (`DataTable<TData>`) beserta fungsi helper kolom (`createIndexColumn`, `createStatusColumn`, `createDateColumn`, `createActionColumn`, `STATUS_FILTER_OPTIONS`, `formatDateIndo`).
  - Komponen `DataTable` secara terpusat menangani:
    - Baris judul halaman, deskripsi, tombol reload, dan tombol aksi tambahan (seperti "Tambah Data" dan "Kelola Kategori").
    - Baris pencarian teks dinamis dan dropdown select filter dengan tombol Reset Filter.
    - Struktur tabel TanStack (`@tanstack/react-table`), loading skeleton spinner, serta pesan data kosong otomatis.
    - Navigasi pagination pintar ("Menampilkan X sampai Y dari Z", Sebelumnya/Selanjutnya, dan nomor halaman).
  - Berhasil merefaktor kelima tabel panel (`running-texts-table.tsx`, `promo-table.tsx`, `video-table.tsx`, `agenda-table.tsx`, dan `pengumuman-table.tsx`) sehingga masing-masing hanya mendefinisikan meta dan kolom spesifiknya saja tanpa duplikasi boilerplate.
  - Menyelaraskan kolom Nomor (`createIndexColumn`): disetel rata kiri (`text-left`) dengan lebar otomatis pas selebar kontennya (`w-px whitespace-nowrap`), memberikan ruang maksimal bagi kolom konten utama pada seluruh tabel.
  - Berhasil lulus `npx tsc --noEmit` dan `npm run build` dengan 0 error.
- T18 (24/7 Hardening, Audit Timer, Penanganan Media Rusak, dan Kiosk Mode):
  - Audit pembersihan timer & memori: Seluruh timer (`setInterval`, `setTimeout`), observer (`ResizeObserver`), animasi (`requestAnimationFrame`), dan event listener (`window.online`, `window.offline`) dipastikan memiliki fungsi _cleanup_ saat _unmount_.
  - Menambahkan rute resmi `/display` ([app/(display)/display/page.tsx](<file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/app/(display)/display/page.tsx>)) yang merender `DisplayScreen` secara publik.
  - Implementasi _Midnight Watcher_ ([hooks/use-midnight-refresh.ts](file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/hooks/use-midnight-refresh.ts)): Memantau pergantian tanggal pada `DASHBOARD_TIMEZONE` dan melakukan reload otomatis di tengah malam untuk membersihkan akumulasi memori peramban serta memuat ulang jadwal sholat, cuaca, dan agenda hari baru.
  - Penanganan toleransi media rusak (_broken media handling_):
    - Video ([video-panel.tsx](file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/components/display/video-panel.tsx)): Otomatis skip ke video berikutnya jika URL gagal dimuat, dilengkapi timer _cooldown_ 30 detik untuk mencoba kembali saat koneksi pulih, serta pemulihan seketika saat event `window.online`.
    - Promo ([promo-panel.tsx](file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/components/display/promo-panel.tsx)): Menyembunyikan gambar yang rusak, fallback ke promo default/placeholder, dilengkapi _cooldown_ retry 60 detik dan listener `window.online`.
    - PANDU ([pandu-panel.tsx](file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/components/display/pandu-panel.tsx)): Menangani kegagalan load QR code secara visual tanpa menampilkan ikon gambar pecah peramban.
  - Ketahanan jaringan: Pemuatan ulang instan ketiga lapisan data (SWR live, In-memory, LocalStorage) serta trigger re-fetch jadwal sholat & cuaca saat koneksi internet tersambung kembali.
  - Dokumentasi Kiosk Mode: Dibuat panduan teknis operasional lengkap [docs/KIOSK.md](file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/docs/KIOSK.md) mencakup flag Kiosk Chrome/Edge, skrip auto-launcher `start-videotron.bat`, Windows Startup, Windows Auto-Logon, BIOS AC Power Loss recovery, dan optimasi Windows Update.
  - Penataan Panel Waktu: Menggabungkan slide Jam dan Cuaca menjadi satu slide terpadu (`jam-cuaca`) pada [components/display/waktu-panel.tsx](file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/components/display/waktu-panel.tsx). Waktu, hari, dan tanggal kini tampil berdampingan secara proporsional dengan informasi cuaca (suhu, ikon kondisi, nama status cuaca, dan nama kota) sebelum beralih ke slide jadwal sholat.
  - Penyesuaian Running Text: Mengubah mekanisme animasi marquee pada [components/display/running-text.tsx](file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/components/display/running-text.tsx) dan [app/globals.css](file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/app/globals.css) agar teks selalu mulai meluncur dari batas ujung kanan layar (`translateX(100vw)`) bergerak ke kiri melintasi layar hingga keluar penuh di sisi kiri (`translateX(-100%)`). Kecepatan animasi disesuaikan secara dinamis agar ritme membaca tetap nyaman (~100px/s).
  - Standarisasi Styling Card Panel shadcn: Menghapus border hijau (`#a7f3d0`) dari seluruh panel layar. [components/display/panel.tsx](file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/components/display/panel.tsx) kini sepenuhnya menggunakan styling dasar Card bawaan shadcn (`bg-card`, `text-card-foreground`, `rounded-2xl`, ring border netral `ring-1 ring-foreground/10`), token `--c-border` pada [app/globals.css](file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/app/globals.css) diselaraskan ke `var(--border)`, dan seluruh garis pemisah internal beralih ke komponen `<Separator />` standar shadcn.
  - Redesain Tiket / Kanban Board untuk Pengumuman dan Agenda:
    - [components/display/pengumuman-panel.tsx](file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/components/display/pengumuman-panel.tsx): Item pengumuman kini ditata seperti tiket Kanban/Jira individual dengan aksen garis vertikal di sisi kiri (`border-l-4`) sesuai warna kategori, pill kategori bernuansa soft dengan dot warna, tanggal berikon `Calendar`, serta badge counter pada header kolom.
    - [components/display/agenda-panel.tsx](file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/components/display/agenda-panel.tsx): Item agenda ditata sebagai kartu tugas Kanban dengan aksen border vertikal emerald, pill badge jam berikon `Clock` tabular, pill status "Hari Ini", judul tebal, serta baris lokasi dengan ikon `MapPin`.
    - Empty state kedua panel dilengkapi kartu dashed yang rapi dengan ikon representatif.
  - Penyelarasan Layout Panel Jam & Cuaca: Pada [components/display/waktu-panel.tsx](file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/components/display/waktu-panel.tsx), elemen jam dan tanggal di atas separator kini terkunci di sisi atas (`stick to top`), sedangkan elemen cuaca dan separator terkunci di sisi bawah (`stick to bottom`), memanfaatkan seluruh tinggi card panel secara penuh dan seimbang.
  - Background Image Waktu & Azan:
    - Menghubungkan aset `public/images/waktu-panel.jpg` sebagai gambar latar belakang panel waktu standar (`jam-cuaca` dan `sholat`).
    - Menghubungkan aset `public/images/azan.jpeg` sebagai latar belakang slide mode Azan dengan lapisan overlay kontras gelap emerald (`bg-emerald-950/75`), memastikan ornamen menara masjid tampak anggun dan teks informasi azan/countdown tetap tajam terbaca.
    - Menguji pratinjau mode Azan pada [components/display/waktu-panel.tsx](file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/components/display/waktu-panel.tsx), kemudian mengembalikannya ke _behavior_ otomatis standar berbasis jadwal sholat aktif (`prayerMode.isAzanMode`).
  - Perbaikan Perhitungan Hitung Mundur & Penentuan Sholat Terdekat pada Panel Azan:
    - Memperbarui [hooks/use-prayer-mode.ts](file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/hooks/use-prayer-mode.ts) agar mengekspos `nextPrayer` dan `targetPrayer` secara dinamis dari jadwal sholat aktif relatif terhadap `secondsNow`. Jika di luar jendela azan (misal saat pengujian/pratinjau atau kondisi tak terduga), panel selalu mendeteksi jadwal sholat terdekat berikutnya (seperti Dzuhur pada pagi hari) dan menghitung sisa waktu secara fungsional (`targetPrayer.at - secondsNow`) yang berdetak setiap detik.
    - Menghapus fallback statis (Maghrib dan "05:24") pada [components/display/waktu-panel.tsx](file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/components/display/waktu-panel.tsx). Seluruh penamaan sholat, jam azan, dan hitung mundur kini berpatokan langsung pada jadwal sholat aktual (`targetPrayer`), mendukung format `HH:MM:SS` maupun `MM:SS`, serta menampilkan "Sedang Azan" saat waktu sholat telah masuk.
  - Warna Teks Suhu Dinamis:
    - Menambahkan fungsi helper `getTemperatureColor` pada [components/display/waktu-panel.tsx](file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/components/display/waktu-panel.tsx) yang memetakan warna teks angka suhu berdasarkan nilainya: warna gelap tegas (`text-[var(--c-text)]`) pada suhu nyaman/sejuk (<= 28°C), oranye hangat (`text-amber-600`) pada 29°C–31°C, oranye kemerahan (`text-orange-600`) pada 32°C–33°C, dan merah keorenan tegas (`text-red-600`) pada suhu sangat panas (>= 34°C).
  - Eliminasi Garis Flickering GPU (Running Text & Waktu Panel):
    - Mendiagnosis penyebab garis flicker: animasi marquee running text berjalan di _root stacking context_ dengan pergeseran `translateX(100vw)`, sementara elemen `z-10` dan `backdrop-blur` pada waktu-panel ikut dirender ulang oleh GPU compositor di level yang sama setiap frame, memicu artefak batas ubin (_tile seam flickering_).
    - Menerapkan isolasi lapisan GPU menyeluruh:
      - Menambahkan `isolate` (`isolation: isolate`) dan `contain: paint` pada [components/display/running-text.tsx](file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/components/display/running-text.tsx) serta pembungkus grid utama di [components/display/lobby-screen.tsx](file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/components/display/lobby-screen.tsx).
      - Mengisolasi `<Panel>` di [components/display/waktu-panel.tsx](file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/components/display/waktu-panel.tsx) dengan `isolate` dan `contain: paint` sehingga elemen bertingkat `z-10` (kartu sholat aktif dan teks azan) terlokalisasi sepenuhnya.
      - Menghapus `backdrop-blur-[1px]` pada lapisan gelap slide azan yang sebelumnya memicu shader re-sampling per frame.
      - Menambahkan `translate3d`, `transform: translateZ(0)`, dan `backface-visibility: hidden` pada `.animate-marquee` di [app/globals.css](file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/app/globals.css) guna menstabilkan _hardware rasterization_.
  - Pemisahan Slide Menjelang Azan (Slide 4) dan Saat Waktu Azan Tiba (Slide 5):
    - Slide 4 (`data-slide="azan"`) dikhususkan untuk fase menjelang azan dengan background `menjelang-azan.jpeg` dan komponen ubin hitung mundur (`CountdownTiles`).
    - Slide 5 (`data-slide="azan-tiba"`) didedikasikan untuk fase masuk waktu sholat dengan background `azan.png`, ikon megaphone berdenyut, dan badge "Memasuki waktu solat".
    - Logika `currentSlide` pada [components/display/waktu-panel.tsx](file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/components/display/waktu-panel.tsx) mengarahkan tampilan ke Slide 5 saat `prayerMode.isArrived` aktif, atau Slide 4 saat masih dalam hitung mundur menjelang azan, tanpa mengubah struktur internal masing-masing slide.
    - Mengembalikan `availableSlides` standar (`jam-cuaca` dan `sholat`) sehingga kedua slide azan hanya aktif otomatis saat memasuki jadwal azan (`prayerMode.isAzanMode`).
  - Penyesuaian Rasio Panel Promo (4:5 Postingan Sosmed Modern) & Logo Branding:
    - Mengembalikan ukuran baris panel waktu ke semula (`--rows-left: 38fr 62fr`) di [app/globals.css](file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/app/globals.css) agar proporsi panel jam, cuaca, dan jadwal sholat tetap persis seperti yang telah disetujui sebelumnya.
    - Mengonfigurasi [components/display/promo-panel.tsx](file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/components/display/promo-panel.tsx) agar lebarnya memenuhi 100% kolom (`w-full`) dengan rasio 4:5 (`aspect-[4/5]`), sehingga tinggi kartu mengikuti proporsi 5 secara otomatis.
    - Menambahkan komponen [components/display/branding-logos.tsx](file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/components/display/branding-logos.tsx) pada sisa ruang vertikal di bawah kartu promo di [components/display/lobby-screen.tsx](file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/components/display/lobby-screen.tsx), yang menampilkan logo resmi daerah ("Dumai Berkhidmat! Menuju Kota Idaman" dari `public/images/berkhidmat colorful.png` dan "#bangga melayani bangsa" dari `public/images/bangga.png`) secara polos tanpa card/border/divider dan memiliki batas tinggi `max-h-[75%]` dari komponen.
    - Menambahkan helper [lib/media.ts](file:///c:/Users/admin/.gemini/antigravity/scratch/bppddmi-videotron/lib/media.ts) (`normalizeMediaUrl`) yang otomatis mengubah format link Google Drive (`drive.usercontent.google.com/download` maupun `drive.google.com/file/d/`) ke format direct embed CDN (`https://lh3.googleusercontent.com/d/{id}`) agar tidak terblokir oleh browser CORP (*Cross-Origin Resource Policy: same-site*).
  - Standarisasi Tombol CTA Seluruh Form Admin:
    - Menyelaraskan seluruh tombol CTA di `components/forms/` mengacu pada form referensi `running-texts`:
      - Dialog Tambah (`Add`): Tombol "Batal" (`variant="outline"`) dan tombol submit "Simpan Data" (`<Loader2 className="mr-2 size-4 animate-spin" /> Menyimpan...`).
      - Dialog Ubah (`Edit`): Tombol "Batal" (`variant="outline"`) dan tombol submit "Simpan Perubahan" (`<Loader2 className="mr-2 size-4 animate-spin" /> Menyimpan...`).
      - Dialog Hapus (`Delete`): Tombol "Batal" (`variant="outline"`) dan tombol konfirmasi "Ya, Hapus Data" (`variant="destructive"` dengan `<Loader2 className="mr-2 size-4 animate-spin" /> Menghapus...`).
      - Form Panel (`Pandu`, `Setting`): Tombol "Simpan Perubahan" dengan spinner standar shadcn `variant="default"`.
    - Menghapus semua hardcoded utility warna (`bg-emerald-600 text-white hover:bg-emerald-700`) dan penataan gap ad-hoc agar konsisten menggunakan token tema primer shadcn.
    - Menghapus class `sm:gap-0` pada seluruh `DialogFooter` (`gap-2 pt-2`) dan `AlertDialogFooter` (`gap-2`) sehingga tombol CTA memiliki jarak/spasi (gap) yang rapi di layar desktop maupun mobile.
    - Menambahkan kalkulasi validasi `isFormValid` dan mengaitkannya ke status tombol simpan (`disabled={!isFormValid || isSubmitting}`) di seluruh dialog tambah, edit, form singleton PANDU, Setting, dan dialog Kategori, memastikan tombol Simpan tetap disabled selama isian data wajib belum lengkap.

## Known issues

- `npm run lint` crashes (`contextOrFilename.getFilename is not a function`): ESLint 10 is incompatible with the `eslint-plugin-react` bundled in `eslint-config-next`. Not caused by app code; needs a decision on pinning ESLint 9.
- The `cn` helper comes from the `cn` npm package (`lib/utils.ts` re-exports it), as set up by the initial install.
- Penghapusan fungsionalitas PANDU:
  - Tampilan videotron: menghapus `PanduPanel` dan menyesuaikan kolom tengah agar `VideoPanel` mengisi tinggi penuh kolom tengah secara proporsional.
  - UI Admin: menghapus halaman `app/(panels)/pandu`, form `components/forms/pandu/pandu-form.tsx`, navigasi Layanan PANDU di `components/app-sidebar.tsx`, serta rute pada `proxy.ts`.
  - Backend: menghapus `server/controllers/pandu.controller.ts`, `server/requests/pandu.request.ts`, `server/services/pandu.service.ts`, `server/models/pandu.model.ts`, `server/resources/pandu.resource.ts`, `lib/schemas/pandu.schema.ts`, dan endpoint `app/api/admin/pandu/route.ts`. Memperbarui `server/services/display.service.ts` dan `server/resources/display.resource.ts` tanpa feed pandu.
  - Database: menghapus tabel `pandu` dari `db/schema.ts` dan `db/seed.ts`, serta membuat migrasi SQL Drizzle `drizzle/0001_equal_dagger.sql` (`DROP TABLE "pandu" CASCADE;`).
  - Verifikasi: `npm run build` berhasil tanpa error.
- Implementasi Panel Data Makro Ekonomi Kota Dumai:
  - Tampilan videotron: membuat komponen `components/display/makro-ekonomi-panel.tsx` dengan layout 1 baris yang terdiri dari badge identitas, carousel running text (`.animate-marquee-ticker` looping tanpa jeda), dan elemen QR code dengan rasio tetap 1:1 di sebelah kanan carousel.
  - Layout: memperbarui grid kolom tengah `--rows-center: 75fr 25fr` pada `app/globals.css` dan mengintegrasikannya ke `components/display/lobby-screen.tsx`.
  - Database & Migrasi: membuat tabel `makro_ekonomi` pada `db/schema.ts`, menambahkan seed indikator awal Dumai di `db/seed.ts`, dan men-generate migrasi SQL Drizzle `drizzle/0002_wild_lightspeed.sql`.
  - Backend: menambahkan arsitektur lengkap sesuai `docs/BACKEND.md`: model (`makro-ekonomi.model.ts`), schema Zod (`makro-ekonomi.schema.ts`), request (`makro-ekonomi.request.ts`), resource (`makro-ekonomi.resource.ts`), service (`makro-ekonomi.service.ts`), controller (`makro-ekonomi.controller.ts`), dan route handlers (`app/api/admin/makro-ekonomi/route.ts` & `[id]/route.ts`).
  - Pengaturan QR: menambahkan field `makroQrUrl` dan `makroQrLabel` pada `setting` serta memperbarui feed display `server/services/display.service.ts` dan `server/resources/display.resource.ts`.
  - UI Admin: membuat halaman admin `app/(panels)/makro-ekonomi/page.tsx`, tabel data `components/datatables/makro-ekonomi-table.tsx`, dialog Tambah, Edit, Hapus, card pengaturan QR Code (`qr-makro-ekonomi-card.tsx`), menu sidebar di `components/app-sidebar.tsx`, dan matcher auth di `proxy.ts`.
  - Penyesuaian Tampilan: mengembalikan tinggi penuh elemen QR Code (`h-full aspect-square`) di sisi kanan, serta menyusun area kiri secara vertikal: carousel running text indikator makro ekonomi di bagian atas dan baris kalimat deskripsi resmi sumber data ("Data Indikator Utama Pembangunan Kota Dumai • Sumber Resmi BPS & Bappeda Kota Dumai • Pindai QR di samping untuk rincian data") di bagian bawah dengan indikator titik berdenyut.
  - Penyesuaian Proporsi Layar: memperkecil lebar panel kanan (`--cols-main` dari `4fr` menjadi `2.8fr`) dan memperlebar kolom tengah (dari `6fr` menjadi `7.2fr`), serta meningkatkan proporsi baris video (`--rows-center` menjadi `78fr 22fr`), memungkinkan panel video 16:9 ditampilkan jauh lebih besar dan tinggi di layar videotron lobi.
  - Perbaikan Database: mengeksekusi migrasi Drizzle untuk membuat tabel `makro_ekonomi` dan menjalankan seeding data awal (6 indikator makro ekonomi Kota Dumai), menyelesaikan pesan error "Gagal mengambil data makro ekonomi" pada datatable admin.
  - Perbaikan Select Option & Tampilan Tren Makro Ekonomi:
    - Menambah dukungan tren kontekstual agar indikator yang dinilai positif saat turun (seperti Tingkat Pengangguran Terbuka/TPT, Tingkat Kemiskinan, atau Inflasi yang melandai) dapat direpresentasikan dengan benar:
      1. `naik_positif`: Naik — Positif / Baik (▲ Hijau Emerald, misal: Pertumbuhan Ekonomi, IPM, PDRB)
      2. `turun_positif`: Turun — Membaik / Positif (▼ Hijau Emerald, misal: Pengangguran/TPT, Kemiskinan turun)
      3. `turun_negatif`: Turun — Buruk / Negatif (▼ Merah Rose, misal: Pertumbuhan Ekonomi turun)
      4. `naik_negatif`: Naik — Waspada / Negatif (▲ Merah Rose, misal: Pengangguran/Kemiskinan naik)
      5. `tetap`: Stabil / Tetap (▬ Abu-abu Slate)
    - Database: memperbesar kolom `tren` pada tabel `makro_ekonomi` (`varchar(20)`), men-generate migrasi SQL Drizzle `drizzle/0003_skinny_la_nuit.sql`, menerapkan DDL `ALTER TABLE`, dan memperbarui data indikator yang sudah ada (TPT dan Kemiskinan menjadi `turun_positif`, Pertumbuhan Ekonomi dan IPM menjadi `naik_positif`).
    - Skema & Tipe: memperbarui `lib/schemas/makro-ekonomi.schema.ts`, `server/models/makro-ekonomi.model.ts`, `server/resources/makro-ekonomi.resource.ts`, `types/display.ts`, dan komponen tampilan terkait.
    - Dialog Tambah & Edit (`AddMakroEkonomiDialog` & `EditMakroEkonomiDialog`): menata ulang form dengan field Tren selebar penuh (`sm:max-w-[560px]`), menyajikan opsi Select yang sangat informatif dengan ikon dan label warna per dampak, serta catatan panduan di bawah dropdown mengenai indikator negatif.
    - Datatable Admin (`MakroEkonomiTable`): memperbarui rendering kolom Tren dengan badge berwarna dan label jelas (`Naik (Positif)`, `Turun (Membaik)`, `Turun (Negatif)`, `Naik (Waspada)`, `Stabil`).
    - Panel Videotron (`MakroEkonomiPanel`): indikator seperti TPT dan Kemiskinan yang trennya turun kini ditampilkan dengan badge hijau/emerald ramah ("Turun ▼"), menandakan capaian positif pembangunan daerah.
  - Form Promo: menambahkan panduan dan rekomendasi format tautan langsung Google Drive (`https://lh3.googleusercontent.com/d/{id}=s0`) pada dialog Tambah dan Ubah promo (`AddPromoDialog` dan `EditPromoDialog`).
  - Verifikasi: `npm run build` berhasil 100% tanpa error TypeScript maupun kompilasi.
  - Dashboard admin & CRUD Pengguna (permintaan user):
    - Dashboard (pp/(panels)/dashboard/page.tsx + components/dashboard/dashboard-overview.tsx): sapaan, peringatan jika ada jenis konten tanpa item aktif, kartu statistik (pengumuman, agenda, teks berjalan, promo, video, makro ekonomi, pengguna), agenda mendatang, dan pengumuman terbaru; SWR refresh 60 detik. Backend: model/service/resource/controller dashboard + GET /api/admin/dashboard (tanggal memakai DASHBOARD_TIMEZONE).
    - CRUD Pengguna: halaman /pengguna (sudah ada di sidebar, matcher ditambahkan di proxy.ts), components/datatables/pengguna-table.tsx, dialog tambah/ubah/hapus + pengguna-form-fields.tsx (tampil/sembunyi password, buat otomatis). Backend lengkap sesuai BACKEND.md: lib/schemas/user.schema.ts, user.model/resource/service/request/controller, route /api/admin/pengguna dan [id]. Password di-hash bcrypt, hash tidak pernah dikirim ke client.
    - Aturan: email unik dan disimpan huruf kecil (login ikut dinormalisasi di lib/auth.ts), password minimal 8 karakter, password opsional saat ubah, tidak bisa menghapus akun sendiri maupun pengguna terakhir (ConflictError 409 baru di server/errors/app-error.ts). with-auth.ts kini mengekspor eadSessionToken.
    - Verifikasi: 
pm run build lulus; API diuji (buat, duplikat 409, validasi 422, ubah, hapus 204, dashboard).

- Fitur Realtime Pusher per Panel (Layar Lobby):
  - Mengintegrasikan package pusher (server) dan pusher-js (client).
  - Menambahkan konstanta PUSHER_DISPLAY_CHANNEL ('display-lobby'), PUSHER_PANEL_UPDATE_EVENT ('panel-update'), dan tipe DisplayPanelKey di lib/constants.ts.
  - Backend Realtime Service (server/services/realtime.service.ts): fungsi broadcastPanelUpdate(panel) memicu revalidasi cache display Next.js, mengambil data terbaru panel bersangkutan, dan mengirim broadcast Pusher dengan payload { panel, data, updatedAt }.
  - Integrasi Service Mutasi: seluruh operasi create, update, dan delete di pengumuman.service.ts, kategori.service.ts (mengupdate pengumuman), agenda.service.ts, running-text.service.ts, promo.service.ts, video.service.ts, makro-ekonomi.service.ts, dan setting.service.ts otomatis memicu broadcastPanelUpdate(...).
  - Endpoint Single Panel (GET /api/display?panel=...): controller dan service display mendukung pengambilan satu panel spesifik jika event payload tidak menyertakan data.
  - Client Listener (hooks/use-display-data.ts): mendengarkan event 'panel-update', mencocokkan nilai panel, dan hanya memperbarui data panel tersebut di SWR cache tanpa merestart video playback maupun posisi carousel pada panel lainnya.
  - Server Page (app/(display)/lobby/page.tsx): membaca kredensial Pusher dari environment variable (PUSHER_KEY, PUSHER_CLUSTER, serta fallback NEXT_PUBLIC_*) dan meneruskannya ke DisplayScreen.
  - Verifikasi: npm run typecheck dan npm run build sukses 100% tanpa error.
