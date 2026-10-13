"use client"

import { useSession } from "next-auth/react"

export interface AuthUser {
  id?: string
  fullname?: string | null
  username?: string | null
  email?: string | null
}

export function useAuth() {
  const { data: session, status } = useSession()

  const user: AuthUser | null = session?.user
    ? {
        id: (session.user as any).id,
        fullname: session.user.name || "Admin Bappeda",
        username: session.user.email || "admin@example.com",
        email: session.user.email,
      }
    : null

  return {
    user,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  }
}
