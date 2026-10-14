"use client"

import * as React from "react"
import { flexRender } from "@tanstack/react-table"
import {
  useLegacyTable,
  getCoreRowModel,
  getPaginationRowModel,
  type LegacyColumnDef,
} from "@tanstack/react-table/legacy"
import {
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface DataTableFilterOption {
  label: string
  value: string
}

export interface DataTableFilterConfig {
  key: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  options: DataTableFilterOption[]
  className?: string
}

export interface DataTableSearchConfig {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export interface DataTableProps<
  TData extends Record<string, any> = Record<string, any>,
> {
  // Header Meta
  title: string
  description?: string
  onRefresh?: () => void
  isRefreshing?: boolean
  isLoading?: boolean
  onAdd?: () => void
  addButtonLabel?: string
  extraActions?: React.ReactNode

  // Filters
  search?: DataTableSearchConfig
  filters?: DataTableFilterConfig[]
  hasActiveFilters?: boolean
  onResetFilters?: () => void

  // Data & Columns
  data: TData[]
  columns: LegacyColumnDef<TData, any>[]
  emptyMessage?: string
  itemNoun?: string
  pageSize?: number
  className?: string

  // Optional children (for modals/dialogs)
  children?: React.ReactNode
}

export function DataTable<TData extends Record<string, any>>({
  title,
  description,
  onRefresh,
  isRefreshing = false,
  isLoading = false,
  onAdd,
  addButtonLabel = "Tambah Data",
  extraActions,
  search,
  filters,
  hasActiveFilters = false,
  onResetFilters,
  data,
  columns,
  emptyMessage = "Belum ada data.",
  itemNoun = "data",
  pageSize = 10,
  className,
  children,
}: DataTableProps<TData>) {
  const table = useLegacyTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize,
      },
    },
  })

  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const refreshDisabled = mounted ? isRefreshing || isLoading : false

  return (
    <div className={cn("space-y-4 pb-16 md:pb-20", className)}>
      {/* Page Title & Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {extraActions}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!refreshDisabled) {
                  onRefresh()
                }
              }}
              disabled={refreshDisabled}
              title="Muat ulang data"
            >
              <RefreshCw
                className={`size-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </Button>
          )}
          {onAdd && (
            <Button
              onClick={onAdd}
              className="cursor-pointer bg-emerald-600 pr-4 text-white hover:bg-emerald-700"
            >
              <Plus className="size-4" />
              {addButtonLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      {(search || (filters && filters.length > 0)) && (
        <div className="mt-6 flex flex-1 flex-col items-center gap-2 sm:flex-row">
          {search && (
            <div className="relative w-full sm:w-72">
              <Search className="absolute top-2.5 left-2.5 size-4" />
              <Input
                placeholder={search.placeholder || "Cari data..."}
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                className="h-9 pl-9 text-sm"
              />
            </div>
          )}

          {filters?.map((f) => (
            <div key={f.key} className={f.className || "w-full sm:w-44"}>
              <Select
                value={f.value}
                onValueChange={(val) => f.onChange(val || "")}
              >
                <SelectTrigger className="h-9 w-full text-sm">
                  <SelectValue placeholder={f.placeholder || "Pilih..."}>
                    {(val: string | null) => {
                      if (!val) return f.placeholder || "Pilih..."
                      const found = f.options.find((opt) => opt.value === val)
                      return found ? found.label : val
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {f.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}

          {hasActiveFilters && onResetFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="mr-1 size-3.5" />
              Reset Filter
            </Button>
          )}
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const metaClass = (
                    header.column.columnDef.meta as
                      { className?: string } | undefined
                  )?.className
                  return (
                    <TableHead key={header.id} className={metaClass}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    <span>Memuat data {itemNoun}...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => {
                    const metaClass = (
                      cell.column.columnDef.meta as
                        { className?: string } | undefined
                    )?.className
                    return (
                      <TableCell key={cell.id} className={metaClass}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  {hasActiveFilters ? (
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <p>
                        Tidak ada {itemNoun} yang cocok dengan filter yang
                        dipilih.
                      </p>
                      {onResetFilters && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={onResetFilters}
                          className="text-xs text-primary"
                        >
                          Reset semua filter
                        </Button>
                      )}
                    </div>
                  ) : (
                    emptyMessage
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {!isLoading && table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
          <div>
            Menampilkan{" "}
            <span className="font-medium text-foreground">
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}
            </span>{" "}
            sampai{" "}
            <span className="font-medium text-foreground">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                data.length
              )}
            </span>{" "}
            dari{" "}
            <span className="font-medium text-foreground">{data.length}</span>{" "}
            {itemNoun}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 gap-1 px-2.5 text-xs"
            >
              <ChevronLeft className="size-3.5" />
              Sebelumnya
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: table.getPageCount() }).map((_, idx) => (
                <Button
                  key={idx}
                  variant={
                    table.getState().pagination.pageIndex === idx
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => table.setPageIndex(idx)}
                  className={`size-8 p-0 text-xs ${
                    table.getState().pagination.pageIndex === idx
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : ""
                  }`}
                >
                  {idx + 1}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 gap-1 px-2.5 text-xs"
            >
              Selanjutnya
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {children}
    </div>
  )
}

/* =========================================================================
   REUSABLE COLUMN BUILDERS & HELPERS
   ========================================================================= */

export function createIndexColumn<
  TData extends Record<string, any> = Record<string, any>,
>(): LegacyColumnDef<TData, any> {
  return {
    id: "index",
    header: () => <div className="text-left font-semibold">No.</div>,
    cell: (info) => {
      const table = (info as any).table
      const pageIndex = table?.getState?.()?.pagination?.pageIndex ?? 0
      const pageSize = table?.getState?.()?.pagination?.pageSize ?? 10
      return (
        <div className="text-left text-xs whitespace-nowrap text-muted-foreground">
          {pageIndex * pageSize + info.row.index + 1}
        </div>
      )
    },
    meta: {
      className: "w-px whitespace-nowrap text-left",
    },
  }
}

export function createStatusColumn<
  TData extends Record<string, any> = Record<string, any>,
>(
  accessorKey: keyof TData & string,
  headerTitle: string = "Status"
): LegacyColumnDef<TData, any> {
  return {
    accessorKey,
    header: () => (
      <div className="text-center font-semibold">{headerTitle}</div>
    ),
    cell: (info) => {
      const isActive = Boolean(info.getValue())
      return (
        <div className="text-center">
          <Badge
            variant={isActive ? "default" : "secondary"}
            className={`py-0 text-xs leading-none font-normal ${
              isActive
                ? "bg-emerald-600 text-white hover:bg-emerald-600/90"
                : "text-muted-foreground"
            }`}
          >
            {isActive ? "Aktif" : "Nonaktif"}
          </Badge>
        </div>
      )
    },
  }
}

export function createDateColumn<
  TData extends Record<string, any> = Record<string, any>,
>(
  accessorKey: keyof TData & string,
  headerTitle: string = "Dibuat",
  withTime: boolean = false
): LegacyColumnDef<TData, any> {
  return {
    accessorKey,
    header: () => <div className="font-semibold">{headerTitle}</div>,
    cell: (info) => {
      const val = info.getValue() as string
      return (
        <div className="text-xs whitespace-nowrap text-muted-foreground">
          {formatDateIndo(val, withTime)}
        </div>
      )
    },
  }
}

export function createActionColumn<
  TData extends Record<string, any> = Record<string, any>,
>({
  onEdit,
  onDelete,
  editLabel = "Edit Data",
  deleteLabel = "Hapus Data",
}: {
  onEdit?: (item: TData) => void
  onDelete?: (item: TData) => void
  editLabel?: string
  deleteLabel?: string
}): LegacyColumnDef<TData, any> {
  return {
    id: "actions",
    header: () => <div className="text-center font-semibold">Aksi</div>,
    cell: (info) => {
      const row = info.row.original
      return (
        <div className="text-center">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 cursor-pointer"
                >
                  <EllipsisVertical className="size-4" />
                  <span className="sr-only">Menu Aksi</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem
                  onClick={() => onEdit(row)}
                  className="cursor-pointer"
                >
                  <Pencil className="mr-2 size-4" />
                  <span>{editLabel}</span>
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(row)}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 size-4" />
                  <span>{deleteLabel}</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
    meta: {
      className: "w-px whitespace-nowrap text-center",
    },
  }
}

export function formatDateIndo(dateStr: string, withTime = false): string {
  try {
    const d = new Date(dateStr)
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
    if (withTime) {
      options.hour = "2-digit"
      options.minute = "2-digit"
    }
    return new Intl.DateTimeFormat("id-ID", options).format(d)
  } catch {
    return dateStr || "-"
  }
}

export const STATUS_FILTER_OPTIONS: DataTableFilterOption[] = [
  { label: "Semua Status", value: "all" },
  { label: "Hanya Aktif", value: "active" },
  { label: "Hanya Nonaktif", value: "inactive" },
]
