"use client"

import * as React from "react"
import type { LegacyColumnDef } from "@tanstack/react-table/legacy"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import {
  DataTable,
  createActionColumn,
  createDateColumn,
  createIndexColumn,
} from "./data-table"
import { useAuth } from "@/contexts/AuthContext"
import type { UserItem } from "@/types/user"

import { AddPenggunaDialog } from "../forms/pengguna/add-pengguna-dialog"
import { EditPenggunaDialog } from "../forms/pengguna/edit-pengguna-dialog"
import { DeletePenggunaDialog } from "../forms/pengguna/delete-pengguna-dialog"

export function PenggunaTable() {
  const { user: currentUser } = useAuth()
  const currentUserId = currentUser?.id ? Number(currentUser.id) : null

  const [data, setData] = React.useState<UserItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [itemToEdit, setItemToEdit] = React.useState<UserItem | null>(null)
  const [itemToDelete, setItemToDelete] = React.useState<UserItem | null>(null)

  const fetchData = React.useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      const res = await fetch("/api/admin/pengguna")
      if (!res.ok) throw new Error("Gagal mengambil data pengguna")
      const json = await res.json()
      setData(json.data || [])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal memuat data")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredData = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return q ? data.filter((item) => item.email.toLowerCase().includes(q)) : data
  }, [data, searchQuery])

  const columns = React.useMemo<LegacyColumnDef<UserItem>[]>(() => {
    return [
      createIndexColumn<UserItem>(),
      {
        accessorKey: "email",
        header: () => <div className="text-left font-semibold">Email</div>,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">
              {row.original.email}
            </span>
            {row.original.id === currentUserId && (
              <Badge
                variant="outline"
                className="border-emerald-500/40 bg-emerald-500/10 text-emerald-800"
              >
                Anda
              </Badge>
            )}
          </div>
        ),
      },
      createDateColumn<UserItem>("createdAt", "Dibuat"),
      createDateColumn<UserItem>("updatedAt", "Diperbarui"),
      createActionColumn<UserItem>({
        onEdit: (item) => {
          setItemToEdit(item)
          setIsEditOpen(true)
        },
        onDelete: (item) => {
          if (item.id === currentUserId) {
            toast.error("Anda tidak dapat menghapus akun yang sedang digunakan")
            return
          }
          setItemToDelete(item)
          setIsDeleteOpen(true)
        },
        editLabel: "Ubah Pengguna",
        deleteLabel: "Hapus Pengguna",
      }),
    ]
  }, [currentUserId])

  return (
    <div className="space-y-6">
      <DataTable
        title="Pengguna"
        description="Kelola akun yang dapat masuk ke panel admin Layar Lobby."
        data={filteredData}
        columns={columns}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={() => fetchData(true)}
        onAdd={() => setIsAddOpen(true)}
        addButtonLabel="Tambah Pengguna"
        itemNoun="pengguna"
        emptyMessage="Belum ada pengguna. Klik 'Tambah Pengguna' untuk membuat akun baru."
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Cari email pengguna...",
        }}
        hasActiveFilters={searchQuery !== ""}
        onResetFilters={() => setSearchQuery("")}
      />

      <AddPenggunaDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onRefresh={() => fetchData(true)}
      />

      <EditPenggunaDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        item={itemToEdit}
        onRefresh={() => fetchData(true)}
      />

      <DeletePenggunaDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        item={itemToDelete}
        onRefresh={() => fetchData(true)}
      />
    </div>
  )
}
