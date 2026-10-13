"use client"

import * as React from "react"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"
import { ExternalLink, Film } from "lucide-react"
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

import { AddVideoDialog } from "../forms/video/add-video-dialog"
import {
  EditVideoDialog,
  type VideoItem,
} from "../forms/video/edit-video-dialog"
import { DeleteVideoDialog } from "../forms/video/delete-video-dialog"

export function VideoTable() {
  const [data, setData] = React.useState<VideoItem[]>([])
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
  const [itemToEdit, setItemToEdit] = React.useState<VideoItem | null>(null)
  const [itemToDelete, setItemToDelete] = React.useState<VideoItem | null>(null)

  // Fetch API
  const fetchData = React.useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      const res = await fetch("/api/admin/video")
      if (!res.ok) {
        throw new Error("Gagal mengambil data video")
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
        const matchesUrl = item.url.toLowerCase().includes(query)
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
  const columns = React.useMemo<LegacyColumnDef<VideoItem>[]>(
    () => [
      createIndexColumn<VideoItem>(),
      {
        accessorKey: "judul",
        header: () => <div className="font-semibold">Video & URL</div>,
        cell: (info) => {
          const row = info.row.original
          return (
            <div className="flex items-center gap-3">
              <div className="relative size-12 shrink-0 overflow-hidden rounded border bg-muted flex items-center justify-center">
                <Film className="size-5 text-muted-foreground/70" />
              </div>
              <div className="space-y-0.5 min-w-0 max-w-md">
                <p className="font-medium text-foreground truncate">
                  {row.judul}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline flex items-center gap-1 text-primary truncate"
                    title={row.url}
                  >
                    <span className="truncate">{row.url}</span>
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                </div>
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
      createStatusColumn<VideoItem>("isActive"),
      createDateColumn<VideoItem>("createdAt", "Dibuat", false),
      createActionColumn<VideoItem>({
        onEdit: (item) => {
          setItemToEdit(item)
          setIsEditOpen(true)
        },
        onDelete: (item) => {
          setItemToDelete(item)
          setIsDeleteOpen(true)
        },
        editLabel: "Edit Data",
        deleteLabel: "Hapus Video",
      }),
    ],
    []
  )

  return (
    <>
      <DataTable
        title="Daftar Video"
        description="Kelola berkas video dan konten multimedia yang diputar pada panel video layar videotron."
        data={filteredData}
        columns={columns}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={() => fetchData(true)}
        onAdd={() => setIsAddOpen(true)}
        addButtonLabel="Tambah Data"
        itemNoun="video"
        emptyMessage="Belum ada data video. Klik 'Tambah Data' untuk menambahkan video baru."
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Cari video...",
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

      <AddVideoDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onRefresh={fetchData}
      />

      <EditVideoDialog
        item={itemToEdit}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onRefresh={fetchData}
      />

      <DeleteVideoDialog
        item={itemToDelete}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onRefresh={fetchData}
      />
    </>
  )
}
