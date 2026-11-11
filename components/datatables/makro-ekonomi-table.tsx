"use client"

import * as React from "react"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import {
  DataTable,
  createIndexColumn,
  createToggleStatusColumn,
  createActionColumn,
  STATUS_FILTER_OPTIONS,
} from "./data-table"

import { AddMakroEkonomiDialog } from "../forms/makro-ekonomi/add-makro-ekonomi-dialog"
import {
  EditMakroEkonomiDialog,
  type MakroEkonomiItem,
} from "../forms/makro-ekonomi/edit-makro-ekonomi-dialog"
import { DeleteMakroEkonomiDialog } from "../forms/makro-ekonomi/delete-makro-ekonomi-dialog"
import { QrMakroEkonomiCard } from "../forms/makro-ekonomi/qr-makro-ekonomi-card"
import {
  resolveRegionColors,
  type RegionInfo,
  type ResolvedRegionInfo,
} from "@/lib/makro-ekonomi"
import { clearMakroLocalStorageCache } from "@/hooks/use-makro-data"

export function MakroEkonomiTable() {
  const [data, setData] = React.useState<MakroEkonomiItem[]>([])
  const [regions, setRegions] = React.useState<ResolvedRegionInfo[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("")
  const [regionFilter, setRegionFilter] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "active" | "inactive"
  >("all")

  // Dialogs
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [itemToEdit, setItemToEdit] = React.useState<MakroEkonomiItem | null>(
    null
  )
  const [itemToDelete, setItemToDelete] =
    React.useState<MakroEkonomiItem | null>(null)

  // Fetch API
  const fetchData = React.useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      const [makroRes, regionsRes] = await Promise.all([
        fetch("/api/admin/makro-ekonomi"),
        fetch("/api/admin/regions"),
      ])
      if (!makroRes.ok) {
        throw new Error("Gagal mengambil data makro ekonomi")
      }
      const makroJson = await makroRes.json()
      setData(makroJson.data || [])

      if (regionsRes.ok) {
        const regionsJson = await regionsRes.json()
        const rawRegions: RegionInfo[] = regionsJson.data || []
        setRegions(resolveRegionColors(rawRegions))
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal memuat data"
      toast.error(message)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Clear related server/client caches and repopulate macro data from DB
  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true)
    try {
      clearMakroLocalStorageCache()
      const [makroRes, regionsRes] = await Promise.all([
        fetch("/api/admin/makro-ekonomi/refresh", {
          method: "POST",
          cache: "no-store",
        }),
        fetch("/api/admin/regions", { cache: "no-store" }),
      ])
      if (!makroRes.ok) {
        throw new Error("Gagal menyegarkan data makro ekonomi")
      }
      const makroJson = await makroRes.json()
      setData(makroJson.data || [])

      if (regionsRes.ok) {
        const regionsJson = await regionsRes.json()
        const rawRegions: RegionInfo[] = regionsJson.data || []
        setRegions(resolveRegionColors(rawRegions))
      }
      toast.success("Cache dibersihkan dan data makro diperbarui dari database")
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal menyegarkan data makro"
      toast.error(message)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const regionById = React.useMemo(() => {
    return new Map(regions.map((r) => [r.id, r]))
  }, [regions])

  // Inline status toggle: optimistic update, rolled back if the request fails
  const [pendingIds, setPendingIds] = React.useState<Set<number>>(new Set())

  const handleToggleStatus = React.useCallback(
    async (item: MakroEkonomiItem, next: boolean) => {
      const setActive = (value: boolean) =>
        setData((prev) =>
          prev.map((row) =>
            row.id === item.id ? { ...row, isActive: value } : row
          )
        )
      const setPending = (value: boolean) =>
        setPendingIds((prev) => {
          const copy = new Set(prev)
          if (value) copy.add(item.id)
          else copy.delete(item.id)
          return copy
        })

      setPending(true)
      setActive(next)
      try {
        const res = await fetch(`/api/admin/makro-ekonomi/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: next }),
        })
        if (!res.ok) throw new Error("Gagal mengubah status indikator")
        toast.success(next ? "Indikator diaktifkan" : "Indikator dinonaktifkan")
      } catch (err: unknown) {
        setActive(item.isActive)
        toast.error(
          err instanceof Error ? err.message : "Gagal mengubah status"
        )
      } finally {
        setPending(false)
      }
    },
    []
  )

  // Filter Data
  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const region = regionById.get(item.regionId)
      const q = searchQuery.toLowerCase()
      const matchSearch =
        searchQuery === "" ||
        item.judul.toLowerCase().includes(q) ||
        item.tahun.toLowerCase().includes(q) ||
        item.nilai.toLowerCase().includes(q) ||
        Boolean(region?.nama.toLowerCase().includes(q)) ||
        Boolean(region?.kode.toLowerCase().includes(q))

      const matchRegion =
        regionFilter === "all" || String(item.regionId) === regionFilter

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.isActive) ||
        (statusFilter === "inactive" && !item.isActive)

      return matchSearch && matchRegion && matchStatus
    })
  }, [data, regionById, searchQuery, regionFilter, statusFilter])

  const regionFilterOptions = React.useMemo(() => {
    return [
      { label: "Semua Wilayah", value: "all" },
      ...regions.map((r) => ({
        label: `${r.nama} (${r.kode})`,
        value: String(r.id),
      })),
    ]
  }, [regions])

  // Columns definition
  const columns = React.useMemo<LegacyColumnDef<MakroEkonomiItem>[]>(() => {
    return [
      createIndexColumn<MakroEkonomiItem>(),
      {
        accessorKey: "regionId",
        header: () => <div className="text-left font-semibold">Wilayah</div>,
        cell: (info) => {
          const id = info.getValue() as number
          const reg = regionById.get(id)
          if (!reg) {
            return (
              <span className="text-xs text-muted-foreground">
                Wilayah #{id}
              </span>
            )
          }
          return (
            <div className="inline-flex items-center gap-2">
              <span
                className="inline-block size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: reg.warna }}
                aria-hidden="true"
              />
              <span className="text-xs font-medium text-foreground">
                {reg.nama}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {reg.kode}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "judul",
        header: () => <div className="text-left font-semibold">Indikator</div>,
        cell: (info) => (
          <div className="font-medium text-foreground">
            {info.getValue() as string}
          </div>
        ),
      },
      {
        id: "nilai",
        header: () => (
          <div className="text-left font-semibold">Nilai & Satuan</div>
        ),
        cell: ({ row }) => (
          <div className="flex items-baseline gap-1 text-sm font-bold text-emerald-900">
            <span>{row.original.nilai}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {row.original.satuan}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "tahun",
        header: () => (
          <div className="text-center font-semibold">Tahun / Periode</div>
        ),
        cell: (info) => (
          <div className="text-center text-xs font-medium text-muted-foreground">
            {info.getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: "tren",
        header: () => <div className="text-center font-semibold">Tren</div>,
        cell: (info) => {
          const val = info.getValue() as string
          if (val === "naik_positif" || val === "naik") {
            return (
              <div className="flex justify-center">
                <Badge
                  variant="outline"
                  className="gap-1 border-emerald-500/30 bg-emerald-500/15 text-emerald-800"
                >
                  <ArrowUpRight className="size-3" />
                  Naik (Positif)
                </Badge>
              </div>
            )
          }
          if (val === "turun_positif") {
            return (
              <div className="flex justify-center">
                <Badge
                  variant="outline"
                  className="gap-1 border-emerald-500/30 bg-emerald-500/15 text-emerald-800"
                >
                  <ArrowDownRight className="size-3" />
                  Turun (Membaik)
                </Badge>
              </div>
            )
          }
          if (val === "turun_negatif" || val === "turun") {
            return (
              <div className="flex justify-center">
                <Badge
                  variant="outline"
                  className="gap-1 border-rose-500/30 bg-rose-500/15 text-rose-800"
                >
                  <ArrowDownRight className="size-3" />
                  Turun (Negatif)
                </Badge>
              </div>
            )
          }
          if (val === "naik_negatif") {
            return (
              <div className="flex justify-center">
                <Badge
                  variant="outline"
                  className="gap-1 border-rose-500/30 bg-rose-500/15 text-rose-800"
                >
                  <ArrowUpRight className="size-3" />
                  Naik (Waspada)
                </Badge>
              </div>
            )
          }
          return (
            <div className="flex justify-center">
              <Badge
                variant="outline"
                className="gap-1 border-slate-400/30 bg-slate-500/15 text-slate-700"
              >
                <Minus className="size-3" />
                Stabil
              </Badge>
            </div>
          )
        },
      },
      {
        accessorKey: "urutan",
        header: () => <div className="text-center font-semibold">Urutan</div>,
        cell: (info) => (
          <div className="text-center text-xs text-muted-foreground">
            {info.getValue() as number}
          </div>
        ),
      },
      createToggleStatusColumn<MakroEkonomiItem>({
        accessorKey: "isActive",
        onToggle: handleToggleStatus,
        isPending: (item) => pendingIds.has(item.id),
        itemLabel: (item) => item.judul,
      }),
      createActionColumn<MakroEkonomiItem>({
        onEdit: (item) => {
          setItemToEdit(item)
          setIsEditOpen(true)
        },
        onDelete: (item) => {
          setItemToDelete(item)
          setIsDeleteOpen(true)
        },
        editLabel: "Edit Indikator",
        deleteLabel: "Hapus Indikator",
      }),
    ]
  }, [handleToggleStatus, pendingIds, regionById])

  const hasActiveFilters =
    searchQuery !== "" || regionFilter !== "all" || statusFilter !== "all"

  return (
    <div className="space-y-6">
      {/* 1. Pengaturan QR Code Makro Ekonomi */}
      <QrMakroEkonomiCard />

      {/* 2. Tabel Data Indikator Makro Ekonomi */}
      <DataTable
        title="Indikator Makro Ekonomi"
        description="Kelola daftar indikator makro ekonomi per wilayah (Nasional, Provinsi Riau, dan Kabupaten/Kota) untuk halaman grafik serta videotron."
        data={filteredData}
        columns={columns}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        onAdd={() => setIsAddOpen(true)}
        addButtonLabel="Tambah Indikator"
        itemNoun="indikator"
        emptyMessage="Belum ada data indikator makro ekonomi. Klik 'Tambah Indikator' untuk menambahkan data baru."
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Cari indikator, wilayah, atau tahun...",
        }}
        filters={[
          {
            key: "region",
            value: regionFilter,
            onChange: (val: string) => setRegionFilter(val || "all"),
            placeholder: "Pilih wilayah",
            options: regionFilterOptions,
            className: "w-full sm:w-56",
          },
          {
            key: "status",
            value: statusFilter,
            onChange: (val: string) =>
              setStatusFilter(val as "all" | "active" | "inactive"),
            placeholder: "Pilih status",
            options: STATUS_FILTER_OPTIONS,
          },
        ]}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={() => {
          setSearchQuery("")
          setRegionFilter("all")
          setStatusFilter("all")
        }}
      />

      {/* Dialogs */}
      <AddMakroEkonomiDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        regions={regions}
        onRefresh={() => fetchData(true)}
      />

      <EditMakroEkonomiDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        item={itemToEdit}
        regions={regions}
        onRefresh={() => fetchData(true)}
      />

      <DeleteMakroEkonomiDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        item={itemToDelete}
        onRefresh={() => fetchData(true)}
      />
    </div>
  )
}
