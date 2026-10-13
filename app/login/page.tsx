import { Suspense } from "react"
import { LoginForm } from "@/components/forms/login-form"

export const metadata = {
  title: "Login Admin - Layar Informasi Bappeda",
  description:
    "Masuk ke panel administrasi Layar Informasi Lobby Bappeda Kota Dumai",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/30 p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <Suspense
          fallback={
            <div className="text-center text-sm text-muted-foreground">
              Memuat form login...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
