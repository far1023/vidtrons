"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  ShieldCheckIcon,
  AlertCircleIcon,
  Loader2Icon,
} from "lucide-react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawCallbackUrl = searchParams.get("callbackUrl")
  const callbackUrl =
    rawCallbackUrl && rawCallbackUrl !== "/admin" ? rawCallbackUrl : "/dashboard"

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isRedirecting, setIsRedirecting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      })

      if (!res || res.error) {
        setErrorMessage(
          "Email atau kata sandi tidak valid. Silakan periksa kembali."
        )
        setIsLoading(false)
      } else {
        setIsRedirecting(true)
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setErrorMessage(
        "Terjadi kesalahan saat mencoba masuk. Silakan coba lagi."
      )
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border-border p-0 shadow-lg">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            className="flex flex-col justify-between p-6 md:p-8"
            onSubmit={handleSubmit}
          >
            <FieldGroup>
              <div className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 text-primary"></div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Layar Informasi
                </h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Masuk ke panel pengelolaan konten videotron
                </p>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                  <AlertCircleIcon className="size-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Field>
                <FieldLabel htmlFor="email">Alamat Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || isRedirecting}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Kata Sandi</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || isRedirecting}
                  required
                />
              </Field>

              <Field>
                <Button
                  type="submit"
                  className="w-full font-semibold"
                  disabled={isLoading || isRedirecting}
                >
                  {isLoading || isRedirecting ? (
                    <>
                      <Loader2Icon className="mr-2 size-4 animate-spin" />
                      {isRedirecting ? "Mengalihkan..." : "Memverifikasi..."}
                    </>
                  ) : (
                    "Masuk ke Admin"
                  )}
                </Button>
              </Field>

              <FieldDescription className="text-center text-xs text-muted-foreground">
                Layar Informasi Bappeda Dumai &bull; Panel Administrasi.
              </FieldDescription>
            </FieldGroup>
          </form>

          {/* Right side banner matching login-04 block */}
          <div className="relative hidden flex-col justify-between overflow-hidden bg-emerald-950 p-8 text-white md:flex dark:bg-zinc-950">
            {/* Emerald gradient glow effect */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-teal-600/30 blur-3xl dark:bg-emerald-600/30" />
            <div className="pointer-events-none absolute -bottom-36 -left-36 h-72 w-72 rounded-full bg-teal-600/20 blur-3xl dark:bg-teal-600/20" />

            <div className="relative z-10 flex items-center gap-2 font-medium">
              <ShieldCheckIcon className="size-5 text-emerald-400" />
              <span className="text-sm font-semibold tracking-wider text-emerald-400 uppercase">
                Sistem Informasi Digital
              </span>
            </div>

            <div className="relative z-10 flex items-center justify-between border-t border-emerald-800/80 pt-4 text-xs text-zinc-400">
              <span>Resolusi TV: 16:9 Landscape</span>
              <span>Pembaruan: Realtime</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <FieldDescription className="text-xs text-muted-foreground">
        Sekretariat - Bappeda Kota Dumai
      </FieldDescription>
    </div>
  )
}
