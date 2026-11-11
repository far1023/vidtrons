"use client"

import * as React from "react"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import {
  DataTable,
  createIndexColumn,
  createToggleStatusColumn,
  createActionColumn,
  STATUS_FILTER_OPTIONS,
  type DataTableFilterOption,
} from "./data-table"
import { AddRegionDialog } from "../forms/regions/add-region-dialog"
import {
  EditRegionDialog,
  type RegionAdminItem,
} from "../forms/regions/edit-region-dialog"
import { DeleteRegionDialog } from "../forms/regions/delete-region-dialog"
import { resolveRegionColors, type RegionInfo } from "@/lib/makro-ekonomi"

const LEVEL_FILTER_OPTIONS: DataTableFilterOption[] = [
  { label: "Semua Tingkat", value: "all" },
  { label: "Nasional", value: "nasional" },
  { label: "Provinsi", value: "provinsi" },
  { label: "Kabupaten / Kota", value: "kabkota" },
]

export function RegionsTable() {
  const [data, setData] = React.useState<RegionAdminItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("")
  const [levelFilter, setLevelFilter] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">("all")

  // Dialogs
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [itemToEdit, setItemToEdit] = React.useState<RegionAdminItem | null>(null)
  const [itemToDelete, setItemToDelete] = React.useState<RegionAdminItem | null>(null)

  const fetchData = React.useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      const res = await fetch("/api/admin/regions")
      if (!res.ok) {
        throw new Error("Gagal mengambil daftar wilayah")
      }
      const json = await res.json()
      const raw: (RegionInfo & { parentId: number | null; isActive: boolean })[] =
        json.data || []
      const resolved = resolveRegionColors(raw)
      const resolvedMap = new Map(resolved.map((r) => [r.id, r.warna]))

      const items: RegionAdminItem[] = raw.map((r) => ({
        id: r.id,
        kode: r.kode,
        nama: r.nama,
        level: r.level as "nasional" | "provinsi" | "kabkota",
        parentId: r.parentId,
        warna: r.warna,
        resolvedWarna: resolvedMap.get(r.id) || "#059669",
        isActive: r.isActive,
      }))
      setData(items)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal memuat data wilayah"
      toast.error(message)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const regionById = React.useMemo(() => {
    return new Map(data.map((r) => [r.id, r]))
  }, [data])

  const [pendingIds, setPendingIds] = React.useState<Set<number>>(new Set())

  const handleToggleStatus = React.useCallback(
    async (item: RegionAdminItem, next: boolean) => {
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
        const res = await fetch(`/api/admin/regions/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: next }),
        })
        if (!res.ok) throw new Error("Gagal mengubah status wilayah")
        toast.success(
          next
            ? `Wilayah ${item.nama} diaktifkan`
            : `Wilayah ${item.nama} dinonaktifkan`
        )
      } catch (err: unknown) {
        setActive(item.isActive)
        toast.error(
          err instanceof Error ? err.message : "Gagal mengubah status wilayah"
        )
      } finally {
        setPending(false)
      }
    },
    []
  )

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const q = searchQuery.toLowerCase()
      const matchSearch =
        searchQuery === "" ||
        item.nama.toLowerCase().includes(q) ||
        item.kode.toLowerCase().includes(q)

      const matchLevel = levelFilter === "all" || item.level === levelFilter

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.isActive) ||
        (statusFilter === "inactive" && !item.isActive)

      return matchSearch && matchLevel && matchStatus
    })
  }, [data, searchQuery, levelFilter, statusFilter])

  const columns = React.useMemo<LegacyColumnDef<RegionAdminItem>[]>(() => {
    return [
      createIndexColumn<RegionAdminItem>(),
      {
        accessorKey: "kode",
        header: () => <div className="font-semibold text-left">Kode Kemendagri</div>,
        cell: (info) => (
          <Badge variant="outline" className="font-mono text-xs">
            {info.getValue() as string}
          </Badge>
        ),
      },
      {
        accessorKey: "nama",
        header: () => <div className="font-semibold text-left">Nama Wilayah</div>,
        cell: (info) => (
          <div className="font-medium text-foreground">
            {info.getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: "level",
        header: () => <div className="font-semibold text-center">Tingkat</div>,
        cell: (info) => {
          const level = info.getValue() as string
          if (level === "nasional") {
            return (
              <div className="flex justify-center">
                <Badge
                  variant="outline"
                  className="border-rose-500/30 bg-rose-500/10 text-rose-800"
                >
                  Nasional
                </Badge>
              </div>
            )
          }
          if (level === "provinsi") {
            return (
              <div className="flex justify-center">
                <Badge
                  variant="outline"
                  className="border-blue-500/30 bg-blue-500/10 text-blue-800"
                >
                  Provinsi
                </Badge>
              </div>
            )
          }
          return (
            <div className="flex justify-center">
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800"
              >
                Kabupaten / Kota
              </Badge>
            </div>
          )
        },
      },
      {
        accessorKey: "parentId",
        header: () => <div className="font-semibold text-left">Induk</div>,
        cell: (info) => {
          const parentId = info.getValue() as number | null
          if (!parentId) {
            return <span className="text-xs text-muted-foreground">-</span>
          }
          const parent = regionById.get(parentId)
          return (
            <span className="text-xs text-muted-foreground">
              {parent ? `${parent.nama} (${parent.kode})` : `#${parentId}`}
            </span>
          )
        },
      },
      {
        id: "warna",
        header: () => <div className="font-semibold text-left">Warna Grafik</div>,
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className="flex items-center gap-2.5">
              <span
                className="inline-block size-4 shrink-0 rounded-full border shadow-2xs"
                style={{ backgroundColor: item.resolvedWarna }}
                aria-hidden="true"
              />
              {item.warna ? (
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-medium uppercase text-foreground">
                    {item.warna}
                  </span>
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                    Kustom
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs uppercase text-muted-foreground">
                    {item.resolvedWarna}
                  </span>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-muted-foreground">
                    Palet Otomatis
                  </Badge>
                </div>
              )}
            </div>
          )
        },
      },
      createToggleStatusColumn<RegionAdminItem>({
        accessorKey: "isActive",
        onToggle: handleToggleStatus,
        isPending: (item) => pendingIds.has(item.id),
        itemLabel: (item) => item.nama,
      }),
      createActionColumn<RegionAdminItem>({
        onEdit: (item) => {
          setItemToEdit(item)
          setIsEditOpen(true)
        },
        onDelete: (item) => {
          setItemToDelete(item)
          setIsDeleteOpen(true)
        },
        editLabel: "Edit Wilayah",
        deleteLabel: "Hapus Wilayah",
      }),
    ]
  }, [handleToggleStatus, pendingIds, regionById])

  const hasActiveFilters =
    searchQuery !== "" || levelFilter !== "all" || statusFilter !== "all"

  return (
    <div className="space-y-6">
      <DataTable
        title="Daftar Wilayah Pembanding"
        description="Kelola data wilayah pembanding (Nasional, Provinsi, dan Kabupaten/Kota), warna seri grafik, serta status tampil."
        data={filteredData}
        columns={columns}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={() => fetchData(true)}
        onAdd={() => setIsAddOpen(true)}
        addButtonLabel="Tambah Wilayah"
        itemNoun="wilayah"
        pageSize={15}
        emptyMessage="Belum ada data wilayah. Klik 'Tambah Wilayah' untuk menambahkan data baru."
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Cari nama atau kode wilayah...",
        }}
        filters={[
          {
            key: "level",
            value: levelFilter,
            onChange: (val: string) => setLevelFilter(val || "all"),
            placeholder: "Pilih tingkat",
            options: LEVEL_FILTER_OPTIONS,
            className: "w-full sm:w-48",
          },
          {
            key: "status",
            value: statusFilter,
            onChange: (val: string) => setStatusFilter(val as "all" | "active" | "inactive"),
            placeholder: "Pilih status",
            options: STATUS_FILTER_OPTIONS,
          },
        ]}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={() => {
          setSearchQuery("")
          setLevelFilter("all")
          setStatusFilter("all")
        }}
      />

      <AddRegionDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        regions={data}
        onRefresh={() => fetchData(true)}
      />

      <EditRegionDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        item={itemToEdit}
        regions={data}
        onRefresh={() => fetchData(true)}
      />

      <DeleteRegionDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        item={itemToDelete}
        onRefresh={() => fetchData(true)}
      />
    </div>
  )
}
