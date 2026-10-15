"use client"

import * as React from "react"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"
import { Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
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

import { AddPengumumanDialog } from "../forms/pengumuman/add-pengumuman-dialog"
import {
  EditPengumumanDialog,
  type PengumumanItem,
} from "../forms/pengumuman/edit-pengumuman-dialog"
import { DeletePengumumanDialog } from "../forms/pengumuman/delete-pengumuman-dialog"
import {
  ManageKategoriDialog,
  type KategoriItem,
} from "../forms/pengumuman/manage-kategori-dialog"

export function PengumumanTable() {
  const [data, setData] = React.useState<PengumumanItem[]>([])
  const [kategoriList, setKategoriList] = React.useState<KategoriItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "active" | "inactive"
  >("all")
  const [kategoriFilter, setKategoriFilter] = React.useState<string>("all")

  // Dialogs
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [isKategoriOpen, setIsKategoriOpen] = React.useState(false)
  const [itemToEdit, setItemToEdit] = React.useState<PengumumanItem | null>(null)
  const [itemToDelete, setItemToDelete] = React.useState<PengumumanItem | null>(null)

  // Fetch Kategori
  const fetchKategori = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/kategori")
      if (res.ok) {
        const json = await res.json()
        setKategoriList(json.data || [])
      }
    } catch {
      // ignore
    }
  }, [])

  // Fetch API
  const fetchData = React.useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      const res = await fetch("/api/admin/pengumuman")
      if (!res.ok) {
        throw new Error("Gagal mengambil data pengumuman")
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
    fetchKategori()
  }, [fetchData, fetchKategori])

  // Filter client-side
  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        query === "" ||
        item.judul.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? item.isActive
            : !item.isActive

      let matchesKategori = true
      if (kategoriFilter === "none") {
        matchesKategori = item.kategoriId === null
      } else if (kategoriFilter !== "all") {
        matchesKategori = String(item.kategoriId) === kategoriFilter
      }

      return matchesSearch && matchesStatus && matchesKategori
    })
  }, [data, searchQuery, statusFilter, kategoriFilter])

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "all" ||
    kategoriFilter !== "all"

  const resetFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setKategoriFilter("all")
  }

  // Column definitions
  const columns = React.useMemo<LegacyColumnDef<PengumumanItem>[]>(
    () => [
      createIndexColumn<PengumumanItem>(),
      {
        accessorKey: "judul",
        header: () => <div className="font-semibold">Pengumuman</div>,
        cell: (info) => {
          const row = info.row.original
          return (
            <div className="space-y-0.5 max-w-md">
              <p className="font-medium text-foreground">
                {row.judul}
              </p>
              {row.tanggal && (
                <p className="text-xs text-muted-foreground">
                  Tanggal: {row.tanggal}
                </p>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "kategoriNama",
        header: () => <div className="text-center font-semibold">Kategori</div>,
        cell: (info) => {
          const row = info.row.original
          const kategoriName = row.kategoriNama || "Umum"
          return (
            <div className="text-center">
              <Badge
                variant="outline"
                className="py-0 text-xs leading-none font-normal"
              >
                {kategoriName}
              </Badge>
            </div>
          )
        },
      },
      createStatusColumn<PengumumanItem>("isActive"),
      createDateColumn<PengumumanItem>("createdAt", "Dibuat", false),
      createActionColumn<PengumumanItem>({
        onEdit: (item) => {
          setItemToEdit(item)
          setIsEditOpen(true)
        },
        onDelete: (item) => {
          setItemToDelete(item)
          setIsDeleteOpen(true)
        },
        editLabel: "Edit Pengumuman",
        deleteLabel: "Hapus Pengumuman",
      }),
    ],
    []
  )

  const kategoriFilterOptions = React.useMemo(() => {
    return [
      { label: "Semua Kategori", value: "all" },
      { label: "Tanpa Kategori", value: "none" },
      ...kategoriList.map((kat) => ({
        label: kat.nama,
        value: String(kat.id),
      })),
    ]
  }, [kategoriList])

  return (
    <>
      <DataTable
        title="Pengumuman"
        description="Kelola pengumuman informasi publik dan internal Bappeda."
        data={filteredData}
        columns={columns}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={() => {
          fetchData(true)
          fetchKategori()
        }}
        onAdd={() => setIsAddOpen(true)}
        addButtonLabel="Tambah Data"
        itemNoun="pengumuman"
        emptyMessage="Belum ada data pengumuman. Klik 'Tambah Data' untuk menambahkan pengumuman baru."
        extraActions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsKategoriOpen(true)}
            className="cursor-pointer"
          >
            <Tag className="mr-2 size-4" />
            Kelola Kategori
          </Button>
        }
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Cari pengumuman...",
        }}
        filters={[
          {
            key: "kategori",
            value: kategoriFilter,
            onChange: setKategoriFilter,
            placeholder: "Pilih kategori",
            options: kategoriFilterOptions,
          },
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

      <AddPengumumanDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onRefresh={fetchData}
        kategoriList={kategoriList}
      />

      <EditPengumumanDialog
        item={itemToEdit}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onRefresh={fetchData}
        kategoriList={kategoriList}
      />

      <DeletePengumumanDialog
        item={itemToDelete}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onRefresh={fetchData}
      />

      <ManageKategoriDialog
        open={isKategoriOpen}
        onOpenChange={setIsKategoriOpen}
        kategoriList={kategoriList}
        onRefreshKategori={() => {
          fetchKategori()
          fetchData(true)
        }}
      />
    </>
  )
}
