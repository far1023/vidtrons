"use client"

import * as React from "react"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"
import { Calendar, Clock, MapPin } from "lucide-react"
import { toast } from "sonner"

import {
  DataTable,
  createIndexColumn,
  createStatusColumn,
  createDateColumn,
  createActionColumn,
  STATUS_FILTER_OPTIONS,
  formatDateIndo,
} from "./data-table"

import { AddAgendaDialog } from "../forms/agenda/add-agenda-dialog"
import {
  EditAgendaDialog,
  type AgendaItem,
} from "../forms/agenda/edit-agenda-dialog"
import { DeleteAgendaDialog } from "../forms/agenda/delete-agenda-dialog"

export function AgendaTable() {
  const [data, setData] = React.useState<AgendaItem[]>([])
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
  const [itemToEdit, setItemToEdit] = React.useState<AgendaItem | null>(null)
  const [itemToDelete, setItemToDelete] = React.useState<AgendaItem | null>(null)

  // Fetch API
  const fetchData = React.useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      const res = await fetch("/api/admin/agenda")
      if (!res.ok) {
        throw new Error("Gagal mengambil data agenda")
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
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        query === "" ||
        item.judul.toLowerCase().includes(query) ||
        (item.lokasi && item.lokasi.toLowerCase().includes(query))

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? item.isActive
            : !item.isActive

      return matchesSearch && matchesStatus
    })
  }, [data, searchQuery, statusFilter])

  const hasActiveFilters = searchQuery.trim() !== "" || statusFilter !== "all"

  const resetFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
  }

  // Column definitions
  const columns = React.useMemo<LegacyColumnDef<AgendaItem>[]>(
    () => [
      createIndexColumn<AgendaItem>(),
      {
        accessorKey: "judul",
        header: () => <div className="font-semibold">Agenda & Lokasi</div>,
        cell: (info) => {
          const row = info.row.original
          return (
            <div className="space-y-1 max-w-md">
              <p className="font-medium text-foreground line-clamp-1">
                {row.judul}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <Calendar className="size-3.5" />
                  {formatDateIndo(row.tanggal)}
                </span>
                {(row.mulai || row.selesai) && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {row.mulai || ""}
                    {row.selesai ? ` - ${row.selesai}` : ""}
                  </span>
                )}
                {row.lokasi && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {row.lokasi}
                  </span>
                )}
              </div>
            </div>
          )
        },
      },
      createStatusColumn<AgendaItem>("isActive"),
      createDateColumn<AgendaItem>("createdAt", "Dibuat", false),
      createActionColumn<AgendaItem>({
        onEdit: (item) => {
          setItemToEdit(item)
          setIsEditOpen(true)
        },
        onDelete: (item) => {
          setItemToDelete(item)
          setIsDeleteOpen(true)
        },
        editLabel: "Edit Agenda",
        deleteLabel: "Hapus Agenda",
      }),
    ],
    []
  )

  return (
    <>
      <DataTable
        title="Agenda Kegiatan"
        description="Kelola jadwal kegiatan, rapat, dan acara di lingkungan Bappeda."
        data={filteredData}
        columns={columns}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={() => fetchData(true)}
        onAdd={() => setIsAddOpen(true)}
        addButtonLabel="Tambah Data"
        itemNoun="agenda"
        emptyMessage="Belum ada data agenda. Klik 'Tambah Data' untuk menambahkan agenda baru."
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Cari agenda...",
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

      <AddAgendaDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onRefresh={fetchData}
      />

      <EditAgendaDialog
        item={itemToEdit}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onRefresh={fetchData}
      />

      <DeleteAgendaDialog
        item={itemToDelete}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onRefresh={fetchData}
      />
    </>
  )
}
