import type { Metadata } from "next"

import { labels } from "@/lib/labels"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: labels.halaman.judul,
  description: labels.halaman.deskripsi,
}

export default function LobbyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
