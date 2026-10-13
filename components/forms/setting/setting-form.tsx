"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  ExternalLink,
  HelpCircle,
  ImageIcon,
  Loader2,
  RefreshCw,
  Save,
  Tv,
} from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { updateSettingsSchema } from "@/lib/schemas/setting.schema"

export interface SettingsData {
  namaInstansi: string
  slogan: string
  logoUrl: string | null
}

export function SettingForm() {
  const [data, setData] = React.useState<SettingsData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  // Form states
  const [namaInstansi, setNamaInstansi] = React.useState("")
  const [slogan, setSlogan] = React.useState("")
  const [logoUrl, setLogoUrl] = React.useState("")
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Preview load error state
  const [logoError, setLogoError] = React.useState(false)

  const fetchData = React.useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      const res = await fetch("/api/admin/setting")
      if (!res.ok) {
        throw new Error("Gagal mengambil data pengaturan")
      }
      const json = await res.json()
      if (json.data) {
        const item: SettingsData = json.data
        setData(item)
        setNamaInstansi(item.namaInstansi || "")
        setSlogan(item.slogan || "")
        setLogoUrl(item.logoUrl || "")
      }
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

  React.useEffect(() => {
    setLogoError(false)
  }, [logoUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const validation = updateSettingsSchema.safeParse({
      namaInstansi,
      slogan,
      logoUrl: logoUrl.trim() === "" ? null : logoUrl.trim(),
    })

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of validation.error.issues) {
        const path = issue.path[0] as string
        if (path && !fieldErrors[path]) {
          fieldErrors[path] = issue.message
        }
      }
      setErrors(fieldErrors)
      return
    }

    setIsSaving(true)

    try {
      const res = await fetch("/api/admin/setting", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      })

      const json = await res.json()

      if (!res.ok) {
        if (json.details && Array.isArray(json.details)) {
          const fieldErrors: Record<string, string> = {}
          for (const d of json.details) {
            if (d.field) fieldErrors[d.field] = d.message
          }
          setErrors(fieldErrors)
        }
        throw new Error(json.error?.message || "Gagal memperbarui pengaturan")
      }

      toast.success("Pengaturan instansi berhasil disimpan")
      if (json.data) {
        setData(json.data)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan"
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const isValidLogo =
    logoUrl.trim().startsWith("https://") && logoUrl.trim().length > 10

  const isFormValid =
    namaInstansi.trim().length > 0 &&
    slogan.trim().length > 0 &&
    (!logoUrl.trim() || isValidLogo)

  return (
    <div className="space-y-6">
      {/* Title Bar & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Pengaturan Instansi & Layar
          </h2>
          <p className="text-sm text-muted-foreground">
            Kelola identitas instansi, slogan visi misi, logo resmi, dan buka
            tampilan layar videotron.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!isRefreshing && !isLoading) {
                fetchData(true)
              }
            }}
            disabled={isRefreshing || isLoading}
            title="Muat ulang data"
          >
            <RefreshCw
              className={`size-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>

          <a
            href="/display"
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className:
                "gap-1.5 cursor-pointer text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50",
            })}
          >
            <Tv className="size-4" />
            <span>Buka Layar Videotron</span>
            <ExternalLink className="size-3.5 opacity-70" />
          </a>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg border bg-card text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <span>Memuat data pengaturan...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Edit Form */}
          <div className="lg:col-span-7">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Identitas Instansi</CardTitle>
                <CardDescription>
                  Pengaturan ini mengontrol nama, slogan, dan logo yang tampil
                  pada pita header bagian atas layar lobi kantor.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Nama Instansi */}
                  <div className="grid gap-1.5">
                    <Label htmlFor="setting-nama">
                      Nama Instansi <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="setting-nama"
                      placeholder="Contoh: Bappeda Kota Dumai"
                      value={namaInstansi}
                      onChange={(e) => setNamaInstansi(e.target.value)}
                      disabled={isSaving}
                      className={errors.namaInstansi ? "border-destructive" : ""}
                    />
                    {errors.namaInstansi && (
                      <p className="text-xs text-destructive">
                        {errors.namaInstansi}
                      </p>
                    )}
                  </div>

                  {/* Slogan */}
                  <div className="grid gap-1.5">
                    <Label htmlFor="setting-slogan">
                      Slogan / Visi Kantor <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="setting-slogan"
                      placeholder="Contoh: Mewujudkan Dumai Kota IDAMAN"
                      value={slogan}
                      onChange={(e) => setSlogan(e.target.value)}
                      disabled={isSaving}
                      className={errors.slogan ? "border-destructive" : ""}
                    />
                    {errors.slogan && (
                      <p className="text-xs text-destructive">{errors.slogan}</p>
                    )}
                  </div>

                  {/* Logo URL */}
                  <div className="grid gap-1.5">
                    <Label htmlFor="setting-logo">
                      URL Logo Resmi (HTTPS)
                    </Label>
                    <Input
                      id="setting-logo"
                      type="url"
                      placeholder="https://example.com/images/logo-kota-dumai.png"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      disabled={isSaving}
                      className={errors.logoUrl ? "border-destructive" : ""}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Tautan langsung ke file logo berformat PNG atau WebP transparan dengan protokol HTTPS.
                    </p>
                    {errors.logoUrl && (
                      <p className="text-xs text-destructive">
                        {errors.logoUrl}
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={!isFormValid || isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        "Simpan Perubahan"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Live Header Simulation */}
          <div className="lg:col-span-5 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pratinjau Header Layar</CardTitle>
                <CardDescription>
                  Simulasi tampilan pita header atas videotron dengan data terkini.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Simulated HeaderBar */}
                <div className="rounded-xl border bg-emerald-900 p-4 text-white shadow-md">
                  <div className="flex items-center gap-3">
                    {/* Logo box */}
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-white/10 flex items-center justify-center p-1">
                      {isValidLogo && !logoError ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={logoUrl.trim()}
                          alt="Logo Instansi"
                          className="size-full object-contain"
                          onError={() => setLogoError(true)}
                        />
                      ) : (
                        <ImageIcon className="size-6 text-white/50" />
                      )}
                    </div>

                    {/* Text info */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h4 className="font-bold text-sm leading-tight truncate">
                        {namaInstansi || "Bappeda Kota Dumai"}
                      </h4>
                      <p className="text-xs text-emerald-100/80 truncate">
                        {slogan || "Mewujudkan Dumai Kota IDAMAN"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Info & Direct Link */}
                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-2">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <HelpCircle className="size-3.5 text-primary" />
                    <span>Layar Videotron (Display Mode):</span>
                  </div>
                  <p>
                    • Layar videotron berjalan di rute publik{" "}
                    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">
                      /display
                    </code>{" "}
                    yang dirancang khusus untuk TV lobi (orientasi 16:9 landscape tanpa sentuhan).
                  </p>
                  <p>
                    • Pembaruan data pengaturan akan otomatis diterapkan ke layar videotron melalui mekanisme cache revalidation.
                  </p>
                  <div className="pt-1">
                    <a
                      href="/display"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants({
                        variant: "secondary",
                        size: "sm",
                        className: "w-full gap-1.5 text-xs cursor-pointer",
                      })}
                    >
                      <Tv className="size-3.5" />
                      Buka Layar Videotron di Tab Baru
                      <ExternalLink className="size-3 ml-auto opacity-70" />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
