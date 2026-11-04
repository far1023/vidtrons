"use client"

import * as React from "react"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

import {
  DataTable,
  createIndexColumn,
  createToggleStatusColumn,
  createDateColumn,
  createActionColumn,
  STATUS_FILTER_OPTIONS,
} from "./data-table"

import { AddRunningTextDialog } from "../forms/running-texts/add-running-text-dialog"
import {
  EditRunningTextDialog,
  type RunningTextItem,
} from "../forms/running-texts/edit-running-text-dialog"
import { DeleteRunningTextDialog } from "../forms/running-texts/delete-running-text-dialog"

export function RunningTextsTable() {
  const [data, setData] = React.useState<RunningTextItem[]>([])
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
  const [itemToEdit, setItemToEdit] = React.useState<RunningTextItem | null>(null)
  const [itemToDelete, setItemToDelete] = React.useState<RunningTextItem | null>(null)

  // Fetch API
  const fetchData = React.useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      const res = await fetch("/api/admin/running-text")
      if (!res.ok) {
        throw new Error("Gagal mengambil data teks berjalan")
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

  // Inline status toggle: optimistic update, rolled back if the request fails
  const [pendingIds, setPendingIds] = React.useState<Set<number>>(new Set())

  const handleToggleStatus = React.useCallback(
    async (item: RunningTextItem, next: boolean) => {
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
        const res = await fetch(`/api/admin/running-text/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: next }),
        })
        if (!res.ok) throw new Error("Gagal mengubah status teks berjalan")
        toast.success(
          next ? "Teks berjalan diaktifkan" : "Teks berjalan dinonaktifkan"
        )
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

  // Filter client-side
  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const matchesSearch = item.isi
        .toLowerCase()
        .includes(searchQuery.toLowerCase().trim())

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
  const columns = React.useMemo<LegacyColumnDef<RunningTextItem>[]>(
    () => [
      createIndexColumn<RunningTextItem>(),
      {
        accessorKey: "isi",
        header: () => <div className="font-semibold">Teks Berjalan</div>,
        cell: (info) => (
          <div className="max-w-md font-medium text-foreground">
            <p>{info.getValue() as string}</p>
          </div>
        ),
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
      createToggleStatusColumn<RunningTextItem>({
        accessorKey: "isActive",
        onToggle: handleToggleStatus,
        isPending: (item) => pendingIds.has(item.id),
        itemLabel: (item) => item.isi,
      }),
      createDateColumn<RunningTextItem>("createdAt", "Dibuat", true),
      createActionColumn<RunningTextItem>({
        onEdit: (item) => {
          setItemToEdit(item)
          setIsEditOpen(true)
        },
        onDelete: (item) => {
          setItemToDelete(item)
          setIsDeleteOpen(true)
        },
        editLabel: "Edit Teks",
        deleteLabel: "Hapus Teks",
      }),
    ],
    [handleToggleStatus, pendingIds]
  )

  return (
    <>
      <DataTable
        title="Teks Berjalan"
        description="Kelola baris informasi bergerak (running text) pada bagian bawah layar videotron."
        data={filteredData}
        columns={columns}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={() => fetchData(true)}
        onAdd={() => setIsAddOpen(true)}
        addButtonLabel="Tambah Data"
        itemNoun="teks berjalan"
        emptyMessage="Belum ada data teks berjalan. Klik 'Tambah Data' untuk menambahkan teks baru."
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Cari teks berjalan...",
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

      <AddRunningTextDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onRefresh={fetchData}
      />

      <EditRunningTextDialog
        item={itemToEdit}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onRefresh={fetchData}
      />

      <DeleteRunningTextDialog
        item={itemToDelete}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onRefresh={fetchData}
      />
    </>
  )
}
