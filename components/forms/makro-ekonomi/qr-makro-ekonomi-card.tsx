"use client"

import * as React from "react"
import QRCode from "qrcode"
import { toast } from "sonner"
import { Loader2, QrCode, Save, Sparkles } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export function QrMakroEkonomiCard() {
  const [makroQrUrl, setMakroQrUrl] = React.useState("")
  const [makroQrLabel, setMakroQrLabel] = React.useState("")
  const [defaultQrDataUrl, setDefaultQrDataUrl] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [previewError, setPreviewError] = React.useState(false)

  // Generate QR Code default yang mengarah ke /grafik-makro-ekonomi
  React.useEffect(() => {
    const targetUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/grafik-makro-ekonomi`
        : "/grafik-makro-ekonomi"

    QRCode.toDataURL(targetUrl, {
      width: 256,
      margin: 1,
      color: {
        dark: "#064e3b",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => setDefaultQrDataUrl(url))
      .catch((err) => console.error("Gagal generate default QR code:", err))
  }, [])

  // Fetch current setting
  const fetchSettings = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/setting")
      if (!res.ok) throw new Error("Gagal mengambil pengaturan")
      const json = await res.json()
      if (json.data) {
        setMakroQrUrl(json.data.makroQrUrl || "")
        setMakroQrLabel(json.data.makroQrLabel || "")
      }
    } catch {
      toast.error("Gagal memuat pengaturan QR Code")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  React.useEffect(() => {
    setPreviewError(false)
  }, [makroQrUrl])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (makroQrUrl && !makroQrUrl.startsWith("https://")) {
      toast.error("URL QR Code harus menggunakan protokol HTTPS (https://)")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/setting", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          makroQrUrl: makroQrUrl.trim() || null,
          makroQrLabel: makroQrLabel.trim() || null,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        const errorMsg =
          json.details && Array.isArray(json.details)
            ? json.details.map((d: { message?: string }) => d.message).filter(Boolean).join(", ")
            : json.error?.message || "Gagal menyimpan pengaturan QR Code"
        throw new Error(errorMsg)
      }

      toast.success("Pengaturan QR Code Makro Ekonomi berhasil disimpan")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan"
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="shadow-xs border-emerald-950/10">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
            <QrCode className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              QR Code Panel Makro Ekonomi
            </CardTitle>
            <CardDescription className="text-xs">
              Elemen rasio 1:1 di samping carousel makro ekonomi pada layar videotron.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" /> Memuat data...
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col md:flex-row gap-6 items-start">
            {/* Input Form */}
            <div className="flex-1 w-full space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="makro-qr-url" className="text-xs font-medium">
                  URL Gambar QR Code Kustom (Opsional)
                </Label>
                <Input
                  id="makro-qr-url"
                  value={makroQrUrl}
                  onChange={(e) => setMakroQrUrl(e.target.value)}
                  placeholder="Contoh: https://example.com/qr-satudata.png"
                  className="text-xs h-9"
                />
                <p className="text-[0.7rem] text-muted-foreground leading-relaxed">
                  Kosongkan kolom ini jika ingin menggunakan <strong>QR Code bawaan sistem</strong> yang otomatis mengarah ke halaman grafik makro ekonomi (<code className="text-emerald-800 dark:text-emerald-300">/grafik-makro-ekonomi</code>). Isi tautan berkas gambar (<code className="text-xs">https://</code>) jika ingin menggantinya dengan QR kustom.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="makro-qr-label" className="text-xs font-medium">
                  Label / Keterangan Teks
                </Label>
                <Input
                  id="makro-qr-label"
                  value={makroQrLabel}
                  onChange={(e) => setMakroQrLabel(e.target.value)}
                  placeholder="Contoh: Pindai Grafik Makro"
                  maxLength={100}
                  className="text-xs h-9"
                />
                <p className="text-[0.7rem] text-muted-foreground">
                  Teks ringkas yang ditampilkan di bawah atau keterangan QR Code.
                </p>
              </div>

              <div className="pt-1">
                <Button type="submit" size="sm" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-1.5 size-3.5" />
                      Simpan Pengaturan QR
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Live 1:1 Preview */}
            <div className="flex flex-col items-center justify-center shrink-0 self-center md:self-auto rounded-xl border bg-muted/30 p-3">
              <span className="text-[0.68rem] font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <Sparkles className="size-3 text-emerald-600" />
                Simulasi Rasio 1:1 Layar
              </span>
              <div className="relative size-28 aspect-square rounded-xl bg-white p-1.5 border border-emerald-950/15 shadow-xs flex flex-col items-center justify-center overflow-hidden">
                {makroQrUrl && !previewError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={makroQrUrl}
                    alt="Preview QR"
                    className="size-full object-contain"
                    onError={() => setPreviewError(true)}
                  />
                ) : defaultQrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={defaultQrDataUrl}
                    alt="Preview QR Default"
                    className="size-full object-contain"
                  />
                ) : (
                  <div className="flex size-full flex-col items-center justify-center rounded-lg bg-emerald-50/70 p-1 text-center">
                    <QrCode className="size-8 text-emerald-700 mb-1" />
                    <span className="text-[0.62rem] font-medium text-emerald-900 leading-tight line-clamp-1">
                      {makroQrLabel || "Pindai Data"}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-[0.65rem] text-muted-foreground mt-1.5 font-medium">
                {makroQrLabel || (makroQrUrl ? "Pindai Data" : "Default: /grafik-makro-ekonomi")}
              </span>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
