"use client"

import * as React from "react"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import {
  DataTable,
  createIndexColumn,
  createStatusColumn,
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

export function MakroEkonomiTable() {
  const [data, setData] = React.useState<MakroEkonomiItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">("all")

  // Dialogs
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [itemToEdit, setItemToEdit] = React.useState<MakroEkonomiItem | null>(null)
  const [itemToDelete, setItemToDelete] = React.useState<MakroEkonomiItem | null>(null)

  // Fetch API
  const fetchData = React.useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      const res = await fetch("/api/admin/makro-ekonomi")
      if (!res.ok) {
        throw new Error("Gagal mengambil data makro ekonomi")
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

  // Filter Data
  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        searchQuery === "" ||
        item.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tahun.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nilai.toLowerCase().includes(searchQuery.toLowerCase())

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.isActive) ||
        (statusFilter === "inactive" && !item.isActive)

      return matchSearch && matchStatus
    })
  }, [data, searchQuery, statusFilter])

  // Columns definition
  const columns = React.useMemo<LegacyColumnDef<MakroEkonomiItem>[]>(() => {
    return [
      createIndexColumn<MakroEkonomiItem>(),
      {
        accessorKey: "judul",
        header: () => <div className="font-semibold text-left">Indikator</div>,
        cell: (info) => (
          <div className="font-medium text-foreground">{info.getValue() as string}</div>
        ),
      },
      {
        id: "nilai",
        header: () => <div className="font-semibold text-left">Nilai & Satuan</div>,
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
        header: () => <div className="font-semibold text-center">Tahun / Periode</div>,
        cell: (info) => (
          <div className="text-center text-xs font-medium text-muted-foreground">
            {info.getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: "tren",
        header: () => <div className="font-semibold text-center">Tren</div>,
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
        header: () => <div className="font-semibold text-center">Urutan</div>,
        cell: (info) => (
          <div className="text-center text-xs text-muted-foreground">
            {info.getValue() as number}
          </div>
        ),
      },
      createStatusColumn<MakroEkonomiItem>("isActive"),
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
  }, [])

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all"

  return (
    <div className="space-y-6">
      {/* 1. Pengaturan QR Code Makro Ekonomi */}
      <QrMakroEkonomiCard />

      {/* 2. Tabel Data Indikator Makro Ekonomi */}
      <DataTable
        title="Indikator Makro Ekonomi"
        description="Kelola daftar indikator makro ekonomi Kota Dumai yang ditampilkan pada carousel videotron."
        data={filteredData}
        columns={columns}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={() => fetchData(true)}
        onAdd={() => setIsAddOpen(true)}
        addButtonLabel="Tambah Indikator"
        itemNoun="indikator"
        emptyMessage="Belum ada data indikator makro ekonomi. Klik 'Tambah Indikator' untuk menambahkan data baru."
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Cari nama indikator atau tahun...",
        }}
        filters={[
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
          setStatusFilter("all")
        }}
      />

      {/* Dialogs */}
      <AddMakroEkonomiDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onRefresh={() => fetchData(true)}
      />

      <EditMakroEkonomiDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        item={itemToEdit}
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
