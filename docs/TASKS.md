# TASKS

Work one task at a time. Tick when done, then add a note to `PROGRESS.md`.
Layout comes first: T1 to T5 build and verify the component skeleton (see `docs/COMPONENTS.md`) before any data work.

## Layout and component skeleton

- [x] T0. Install Next.js, Tailwind, shadcn/ui (done by user)
- [x] T1. Size tokens: add all size/typography tokens from LAYOUT.md section 3 (including `--fs-countdown`, `--fade-mask`) to `app/globals.css`, with row tokens in `fr` and `--radius-panel` instead of `--radius`. Check there is no clash with shadcn's variables. Do not paste DESIGN.md's `:root` or `@theme` blocks (see AGENTS.md, Design system)
- [x] T2. Colors and fonts: present the mapping from `docs/DESIGN.md` (LAYOUT.md section 3) to the user and wait for approval (dark emerald band for header and running text, free font substitutes via `next/font`), then add the `--c-*` tokens; optionally map shadcn's color variables to the emerald palette for the admin panel. Never paste DESIGN.md's `:root` or `@theme` blocks
- [x] T3. Skeleton foundation (first run `npx shadcn@latest add card`; `Panel` is built on it): `lib/labels.ts`, shared `Panel` / `PanelHeader` / `PanelBody`, `DisplayScreen` (screen grid, main columns, three column grids), `/display` route rendering it. Panels may be bare placeholders at this step
- [x] T4. Panel skeletons (first add `avatar`, `aspect-ratio`, `badge`, `separator`, `carousel` via the CLI): build all 8 panel components with their final structure, optional typed props and placeholder content, exactly as listed in `COMPONENTS.md` (HeaderBar, WaktuPanel, PromoPanel, VideoPanel, PanduPanel, PengumumanPanel, AgendaPanel, RunningText)
- [x] T5. Layout verification at 1366x768, 1920x1080 and 3840x2160 (and a 16:9 browser window): no page scroll, no overflow, no overlapping panels, text readable. Confirm the `fr` row tokens cause no overflow. Fix issues in tokens or `DisplayScreen`, not inside panels

## Data and behavior (only after T5 is approved)

- [x] T6. Drizzle setup: schema in `db/schema.ts` (PostgreSQL), `drizzle.config.ts`, Neon client in `db/index.ts` (dev database/branch first), first generated migration, seed script for all tables; add the `db:generate`, `db:migrate`, `db:push`, `db:studio` scripts and confirm `npm run db:studio` opens against the dev database
- [x] T6A. Backend foundation per `docs/BACKEND.md`: `server/` skeleton, errors, http response helpers, `with-handler`, `with-auth` (deny-all placeholder until T15), shared zod schema, and the `running-text` reference entity end to end (model, schema, request, resource, service, controller, routes)
- [x] T7. `GET /api/display` through the layers (route, controller, `DisplayService`, models, resource) with tagged Next.js caching (date-in-timezone cache key) + SWR polling hook with last-good-data fallback (memory + localStorage)
- [x] T8. HeaderBar (from Setting) and RunningText (marquee, one line) with real data
- [x] T9. (First add `scroll-area`.) `use-autoscroll` hook + `Autoscroll` component (auto-scroll only, no manual-scroll handling); fill PengumumanPanel and AgendaPanel
- [x] T10. PromoPanel behavior on shadcn `Carousel` (horizontal, card-less, portrait images, per-view, last page trimmed to the edge, interval autoplay, fallback image). If Carousel cannot reproduce LAYOUT.md behavior, ask the user before writing a custom one
- [x] T11. Prayer times and weather data layer: create `lib/location.ts` (Kota Dumai, 1.66711, 101.44316), `lib/data-sources.ts` (endpoints, AlAdhan method) and `lib/weather-code.ts` (WMO map from DATA-SOURCES.md); a client hook that fetches both once on initial page load (date in the config timezone, independent failures, retry with backoff, last good data in localStorage); verify CORS, check the AlAdhan method and compare prayer times with the official Dumai schedule
- [x] T12. WaktuPanel: `use-clock`, Jam, Cuaca (label and icon from the weather-code map), Jadwal Sholat slides, `use-prayer-mode` (Azan slide, countdown)
- [x] T13. VideoPanel (playlist, muted autoplay, `aspect-video` + `object-cover`)
- [x] T14. PanduPanel with real data

## Admin and release

- [x] T15. Auth.js login (wire the session check into `with-auth`) + admin layout (add `sidebar`, `button`, `input`, `label`, `card` via the CLI as needed)
- [x] T16. Admin CRUD through the backend layers (BACKEND.md): Pengumuman + Kategori, Agenda, Running text (its backend already exists from T6A; build only the admin UI). Build on shadcn `table`, `form`, `input`, `textarea`, `select`, `switch`, `dialog`, `alert-dialog`, `sonner`, and `calendar` + `popover` for dates; add each via the CLI first
- [x] T17. Admin CRUD through the backend layers (BACKEND.md): Promo, Video, PANDU, Pengaturan with URL fields (same shadcn set; https validation, image/video preview in the form); call `revalidateTag` on every save
- [x] T18. 24/7 hardening: timer cleanup audit, leave running for hours, broken media URL handling (on error, skip the item), kiosk mode and auto-start notes
- [x] T19. Deploy to Vercel: region close to Indonesia (Singapore) for both Vercel functions and the Neon project, environment variables, `.env.example`, backup notes for the database and a list of where media is hosted; check Neon compute usage after a few days
