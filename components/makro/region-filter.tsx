"use client"

import { useMemo, useState } from "react"
import {
  Check,
  ChevronsUpDown,
  MapPin,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DEFAULT_WILAYAH_KODE,
  MAX_REGION_SELECTION,
  resolveRegionColors,
  type RegionInfo,
} from "@/lib/makro-ekonomi"
import { cn } from "@/lib/utils"

export type RegionFilterProps = {
  regions: readonly RegionInfo[]
  selectedKodes: readonly string[]
  onChange: (nextKodes: string[]) => void
  defaultKode?: string
  onRefresh?: () => void
  isRefreshing?: boolean
}

const LEVEL_GROUPS = [
  { key: "nasional", label: "Nasional" },
  { key: "provinsi", label: "Provinsi" },
  { key: "kabkota", label: "Kabupaten / Kota" },
] as const

export function RegionFilter({
  regions,
  selectedKodes,
  onChange,
  defaultKode = DEFAULT_WILAYAH_KODE,
  onRefresh,
  isRefreshing = false,
}: RegionFilterProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const selectedSet = useMemo(
    () => new Set(selectedKodes.map((k) => k.toLowerCase())),
    [selectedKodes]
  )

  const selectedRegions = useMemo(() => {
    const byKode = new Map(regions.map((r) => [r.kode.toLowerCase(), r]))
    const ordered: RegionInfo[] = []
    for (const k of selectedKodes) {
      const found = byKode.get(k.toLowerCase())
      if (found) ordered.push(found)
    }
    return resolveRegionColors(ordered)
  }, [regions, selectedKodes])

  const filteredByLevel = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matching = q
      ? regions.filter(
          (r) =>
            r.nama.toLowerCase().includes(q) || r.kode.toLowerCase().includes(q)
        )
      : regions

    return LEVEL_GROUPS.map((grp) => ({
      ...grp,
      items: matching.filter((r) => r.level === grp.key),
    })).filter((grp) => grp.items.length > 0)
  }, [regions, query])

  const isAtMax = selectedKodes.length >= MAX_REGION_SELECTION
  const isDefaultSelection =
    selectedKodes.length === 1 &&
    selectedKodes[0].toLowerCase() === defaultKode.toLowerCase()

  function toggleKode(kode: string) {
    const lower = kode.toLowerCase()
    if (selectedSet.has(lower)) {
      if (selectedKodes.length <= 1) return
      onChange(selectedKodes.filter((k) => k.toLowerCase() !== lower))
    } else {
      if (isAtMax) return
      onChange([...selectedKodes, kode])
    }
  }

  function resetToDefault() {
    onChange([defaultKode])
  }

  return (
    <div className="mt-6 rounded-xl border border-emerald-950/10 bg-background/90 p-3.5 shadow-xs backdrop-blur-sm sm:mt-8 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <MapPin className="size-3.5 text-emerald-700" aria-hidden />
            Wilayah ({selectedRegions.length}/{MAX_REGION_SELECTION}):
          </span>

          {selectedRegions.map((reg) => {
            const canRemove = selectedRegions.length > 1
            return (
              <Badge
                key={reg.kode}
                variant="secondary"
                className="h-7 gap-1.5 rounded-lg border border-border/80 bg-background px-2.5 text-xs font-medium text-foreground"
              >
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: reg.warna }}
                />
                <span>{reg.nama}</span>
                {canRemove && (
                  <button
                    type="button"
                    onClick={() => toggleKode(reg.kode)}
                    aria-label={`Hapus wilayah ${reg.nama}`}
                    className="-mr-1 ml-0.5 inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </Badge>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          {!isDefaultSelection && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetToDefault}
              className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
              Reset ke Kota Dumai
            </Button>
          )}

          {onRefresh && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Bersihkan cache dan muat ulang data makro dari database"
              aria-label="Muat ulang data makro"
              className="h-9 gap-1.5 text-xs font-medium"
            >
              <RefreshCw
                className={cn("size-3.5", isRefreshing && "animate-spin")}
              />
              <span className="hidden sm:inline">Muat Ulang</span>
            </Button>
          )}

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="Pilih wilayah pembanding"
                  className="h-9 gap-2 text-xs font-medium"
                />
              }
            >
              <span>Bandingkan Wilayah</span>
              <ChevronsUpDown className="size-3.5 text-muted-foreground" />
            </PopoverTrigger>

            <PopoverContent align="end" className="w-80 p-3 sm:w-96">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground">
                    Pilih Wilayah (maks. {MAX_REGION_SELECTION})
                  </p>
                  <span className="text-[11px] text-muted-foreground">
                    {selectedRegions.length} dipilih
                  </span>
                </div>

                <div className="relative">
                  <Search
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari nama atau kode wilayah..."
                    aria-label="Cari nama atau kode wilayah"
                    className="h-8 pl-8 text-xs"
                  />
                </div>

                <ScrollArea className="h-64 pr-2">
                  {filteredByLevel.length === 0 ? (
                    <p className="py-8 text-center text-xs text-muted-foreground">
                      Wilayah dengan kata kunci &ldquo;{query}&rdquo; tidak
                      ditemukan.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {filteredByLevel.map((group) => (
                        <div key={group.key} className="space-y-1">
                          <p className="px-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                            {group.label}
                          </p>
                          <ul className="space-y-0.5">
                            {group.items.map((reg) => {
                              const isSelected = selectedSet.has(
                                reg.kode.toLowerCase()
                              )
                              const isLastSelected =
                                isSelected && selectedRegions.length === 1
                              const disabled =
                                (!isSelected && isAtMax) || isLastSelected

                              return (
                                <li key={reg.id}>
                                  <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => toggleKode(reg.kode)}
                                    className={cn(
                                      "flex min-h-9 w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                                      isSelected
                                        ? "bg-emerald-50 font-medium text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100"
                                        : "hover:bg-muted",
                                      disabled &&
                                        !isSelected &&
                                        "cursor-not-allowed opacity-50"
                                    )}
                                  >
                                    <div className="flex min-w-0 items-center gap-2">
                                      <span
                                        aria-hidden
                                        className="size-2.5 shrink-0 rounded-[2px] border border-black/10"
                                        style={{
                                          backgroundColor:
                                            reg.warna ?? "#94a3b8",
                                        }}
                                      />
                                      <span className="truncate">
                                        {reg.nama}
                                      </span>
                                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                                        {reg.kode}
                                      </span>
                                    </div>
                                    {isSelected && (
                                      <Check
                                        aria-hidden
                                        className="size-3.5 shrink-0 text-emerald-700 dark:text-emerald-300"
                                      />
                                    )}
                                  </button>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {isAtMax && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    Maksimal {MAX_REGION_SELECTION} wilayah telah dipilih. Hapus
                    salah satu untuk memilih wilayah lain.
                  </p>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}
