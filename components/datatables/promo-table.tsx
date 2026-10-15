"use client"

import * as React from "react"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"
import { ImageIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

import {
  DataTable,
  createIndexColumn,
  createStatusColumn,
  createDateColumn,
  createActionColumn,
  STATUS_FILTER_OPTIONS,
} from "./data-table"

import { AddPromoDialog } from "../forms/promo/add-promo-dialog"
import {
  EditPromoDialog,
  type PromoItem,
} from "../forms/promo/edit-promo-dialog"
import { DeletePromoDialog } from "../forms/promo/delete-promo-dialog"

export function PromoTable() {
  const [data, setData] = React.useState<PromoItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "active" | "inactive"
  >("all")

  // Dialogs
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [itemToEdit, setItemToEdit] = React.useState<PromoItem | null>(null)
  const [itemToDelete, setItemToDelete] = React.useState<PromoItem | null>(null)

  // Fetch API
  const fetchData = React.useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      const res = await fetch("/api/admin/promo")
      if (!res.ok) {
        throw new Error("Gagal mengambil data promo")
      }
      const json = await res.json()
      setData(json.data || [])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal memuat data"
      toast.error(message)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter client-side
  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase()
        const matchesJudul = item.judul.toLowerCase().includes(query)
        const matchesUrl = item.gambarUrl.toLowerCase().includes(query)
        if (!matchesJudul && !matchesUrl) return false
      }

      if (statusFilter === "active" && !item.isActive) return false
      if (statusFilter === "inactive" && item.isActive) return false

      return true
    })
  }, [data, searchQuery, statusFilter])

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all"

  const resetFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
  }

  // Column definitions
  const columns = React.useMemo<LegacyColumnDef<PromoItem>[]>(
    () => [
      createIndexColumn<PromoItem>(),
      {
        accessorKey: "judul",
        header: () => <div className="font-semibold">Promo & Gambar</div>,
        cell: (info) => {
          const row = info.row.original
          return (
            <div className="flex items-center gap-3">
              <div className="relative size-12 shrink-0 overflow-hidden rounded border bg-muted flex items-center justify-center">
                {row.gambarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.gambarUrl}
                    alt={row.judul}
                    className="size-full object-cover"
                  />
                ) : (
                  <ImageIcon className="size-5 text-muted-foreground/70" />
                )}
              </div>
              <div className="space-y-0.5 min-w-0 max-w-md">
                <p className="font-medium text-foreground">
                  {row.judul}
                </p>
                <p className="text-xs text-muted-foreground">
                  {row.gambarUrl}
                </p>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "urutan",
        header: () => <div className="text-center font-semibold">Urutan</div>,
        cell: (info) => (
          <div className="text-center">
            <Badge
              variant="outline"
              className="px-2 py-0 text-xs leading-none font-mono"
            >
              {info.getValue() as number}
            </Badge>
          </div>
        ),
      },
      createStatusColumn<PromoItem>("isActive"),
      createDateColumn<PromoItem>("createdAt", "Dibuat", false),
      createActionColumn<PromoItem>({
        onEdit: (item) => {
          setItemToEdit(item)
          setIsEditOpen(true)
        },
        onDelete: (item) => {
          setItemToDelete(item)
          setIsDeleteOpen(true)
        },
        editLabel: "Edit Data",
        deleteLabel: "Hapus Promo",
      }),
    ],
    []
  )

  return (
    <>
      <DataTable
        title="Promo & Spanduk"
        description="Kelola banner visual promosi atau pengumuman grafis yang berotasi pada panel promo videotron."
        data={filteredData}
        columns={columns}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={() => fetchData(true)}
        onAdd={() => setIsAddOpen(true)}
        addButtonLabel="Tambah Data"
        itemNoun="promo"
        emptyMessage="Belum ada data promo. Klik 'Tambah Data' untuk menambahkan promo baru."
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Cari promo...",
        }}
        filters={[
          {
            key: "status",
            value: statusFilter,
            onChange: (val) => setStatusFilter(val as "all" | "active" | "inactive"),
            placeholder: "Pilih status",
            options: STATUS_FILTER_OPTIONS,
          },
        ]}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetFilters}
      />

      <AddPromoDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onRefresh={fetchData}
      />

      <EditPromoDialog
        item={itemToEdit}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onRefresh={fetchData}
      />

      <DeletePromoDialog
        item={itemToDelete}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onRefresh={fetchData}
      />
    </>
  )
}
