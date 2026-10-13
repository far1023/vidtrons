# COMPONENTS: layout skeleton

Design and behavior come from `docs/LAYOUT.md`; colors and fonts come from `docs/DESIGN.md` through the `--c-*` tokens. This file defines the component structure used to implement it. Build the skeleton first (tasks T3 to T5), then fill panels one by one in later tasks.

## Principles

1. **One component per panel**, each in its own file under `components/display/`.
2. **`DisplayScreen` owns the grid.** It is the only file that uses the `--rows-*` and `--cols-main` tokens. Panels never set their own outer size; they fill the grid cell they are placed in.
3. **Skeleton means final structure, no behavior.** Correct markup, token-based classes and typed props, but no fetching, no timers, no `'use client'`, no real data.
4. **Placeholders, not fake data.** Show the panel's name or an empty structure, never invented announcements or times.
5. **All text from `lib/labels.ts`** (Indonesian). No text literals in markup.
6. **Tokens only.** Sizes, gaps, radius, fonts and colors come from CSS variables (`--gap`, `--pad`, `--radius-panel`, `--fs-*`, `--c-*`). No raw pixel values, no raw palette classes.
7. **Passive display.** No buttons, links or hover states.
8. **Optional props with placeholder fallbacks.** Define the data contract now (table below) so later tasks only pass data in.
9. **shadcn first.** Use a shadcn component wherever one exists, added with `npx shadcn@latest add <name>` before use (see "shadcn mapping"). Tokens override shadcn's default spacing and radius through `className` in the wrappers, never by editing `components/ui/`.

## Component tree

```text
app/(display)/display/page.tsx  ->  <DisplayScreen />

DisplayScreen              components/display/display-screen.tsx
├─ HeaderBar               row 1 (10%)
├─ <main> 3 columns        row 2 (85%), columns 2fr / 6fr / 4fr
│  ├─ left column          rows by --rows-left
│  │  ├─ WaktuPanel
│  │  └─ PromoPanel
│  ├─ center column        rows by --rows-center
│  │  ├─ VideoPanel
│  │  └─ PanduPanel
│  └─ right column         rows by --rows-right
│     ├─ PengumumanPanel
│     └─ AgendaPanel
└─ RunningText             row 3 (5%)
```

Shared building blocks (`components/display/panel.tsx`):

- `Panel`: wrapper around shadcn `Card`, with `min-h-0`, `min-w-0`, `overflow-hidden` and the radius and background tokens. Reset Card's default padding, gap and shadow through `className` so only tokens control spacing; the border is 1 px `--c-border` with no shadow (the DESIGN.md card style). Accepts extra classes.
- `PanelHeader`: shadcn `CardHeader` + `CardTitle` as the fixed header (`--fs-title`). No "Lihat" cue.
- `PanelBody`: shadcn `CardContent` as a `flex-1 min-h-0` slot below the header; the autoscroll list goes here in T9.

Other: `lib/labels.ts` (UI text), `app/(display)/display/page.tsx` (route).

## shadcn mapping

Add each component with the CLI before first use. If a default shadcn style fights the tokens, override it in the wrapper, not in `components/ui/`.

| Need                                                                                | shadcn component                                                                                                                                  | Used in                             | Add in                         |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------ |
| Panel container, header, body                                                       | `card`                                                                                                                                            | `Panel`, `PanelHeader`, `PanelBody` | T3                             |
| Logos                                                                               | `avatar`                                                                                                                                          | HeaderBar, PanduPanel               | T4                             |
| Fixed ratios (16:9 video, square QR)                                                | `aspect-ratio`                                                                                                                                    | VideoPanel, PanduPanel              | T4                             |
| Time range and category chips                                                       | `badge`                                                                                                                                           | AgendaPanel, PengumumanPanel        | T4                             |
| Divider between list items                                                          | `separator`                                                                                                                                       | PengumumanPanel, AgendaPanel        | T4                             |
| Promo carousel (embla; horizontal, portrait images, per-view, last page trimmed to the edge, autoplay) | `carousel`                                                                                                                                        | PromoPanel                          | T4 (structure), T10 (behavior) |
| Scroll container under the autoscroll hook                                          | `scroll-area`                                                                                                                                     | PengumumanPanel, AgendaPanel        | T9                             |
| Admin: layout, forms, tables, dialogs, toasts, date pickers                         | `sidebar`, `button`, `input`, `label`, `textarea`, `select`, `switch`, `form`, `table`, `dialog`, `alert-dialog`, `sonner`, `calendar`, `popover` | admin panel                         | T15 to T17                     |

No shadcn equivalent, so custom (still using tokens and `cn`): the screen grid (`DisplayScreen`), clock and crossfade slide stack (WaktuPanel), prayer-mode and azan countdown, autoscroll behavior, running-text marquee.

If a shadcn component cannot reproduce a behavior required by `docs/LAYOUT.md` (for example the Carousel and the promo paging rules), stop and ask the user before writing a custom replacement.

## Grid rules (from LAYOUT.md sections 4, 14, 15)

- Screen: `w-screen h-screen overflow-hidden grid` with `grid-rows-[var(--rows-screen)]`.
- Main: `min-h-0 grid grid-cols-[var(--cols-main)] gap-[var(--gap)] px-[var(--pad-x)]`.
- Each column: `min-h-0 grid gap-[var(--gap)]` with its own `--rows-*` token.
- Every grid/flex container with dynamic content has `min-h-0`.
- No absolute positioning for panels (only decorative overlays).
- Row tokens use `fr` (not `%`) so the `gap` is accounted for; verify there is no overflow in T5.

## Panel skeletons

| Component         | File                   | Final structure in the skeleton                                                                                                                                                      | Optional props (future data)                                            | Filled in |
| ----------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | --------- |
| `HeaderBar`       | `header-bar.tsx`       | Flex row: logo in a shadcn `Avatar` (square, about 70% of header height), instansi name, slogan (truncate)                                                                           | `nama`, `slogan`, `logoUrl`                                             | T8        |
| `WaktuPanel`      | `waktu-panel.tsx`      | `Panel` as a grid; slides stacked in one cell (`col-start-1 row-start-1`, `data-active`); only the Jam slide with placeholder day/date/time. Export the shared slide class for reuse | `cuaca` (`suhu`, `kondisi`, `ikon`), `jadwalSholat[]` (`nama`, `waktu`) | T11, T12  |
| `PromoPanel`      | `promo-panel.tsx`      | No card (not wrapped in `Panel`): shadcn `Carousel` (horizontal) filling its grid cell, `perView` items per view (default 1); portrait images with `object-contain`, placeholder items when empty                                                      | `perView`, `items[]` (`judul`, `gambarUrl`)                             | T10       |
| `VideoPanel`      | `video-panel.tsx`      | shadcn `AspectRatio` (16:9, `w-full max-h-full`, overflow hidden) on a dark background with an `object-cover` video slot (empty until a source exists)                               | `src` / playlist                                                        | T13       |
| `PanduPanel`      | `pandu-panel.tsx`      | Flex row: logo in `Avatar` (`--icon` square), name + description block, QR in a square `AspectRatio` with the username below                                                         | `nama`, `deskripsi`, `logoUrl`, `qrUrl`, `telegramUsername`             | T14       |
| `PengumumanPanel` | `pengumuman-panel.tsx` | `Panel` flex column: `PanelHeader` (title from labels) + empty `PanelBody`                                                                                                           | `items[]` (`judul`, `tanggal`, `kategori.warna`)                        | T9        |
| `AgendaPanel`     | `agenda-panel.tsx`     | Same structure as Pengumuman with the "Agenda Hari Ini" title                                                                                                                        | `items[]` (`judul`, `mulai`, `selesai`, `lokasi`)                       | T9        |
| `RunningText`     | `running-text.tsx`     | One-line, `whitespace-nowrap`, vertically centered row with one placeholder message and bullet separator logic                                                                       | `items[]` (`isi`)                                                       | T8        |

## Skeleton acceptance checklist (T5)

- [ ] `/display` renders all 8 panels in the layout shown in LAYOUT.md section 2
- [ ] No page scrollbars at 1366x768, 1920x1080 and 3840x2160
- [ ] No panel overflows or is covered by a neighbor (check the bottom panels against the running text)
- [ ] Fonts, gaps, padding and radius scale with screen size (tokens only)
- [ ] No text literals, raw pixel values or raw palette colors in the components
- [ ] Props are typed, optional and have placeholder fallbacks
- [ ] Every element that shadcn provides uses the shadcn component (none hand-written), and each one was added via the CLI
- [ ] `npm run build` passes
