import type { Metadata } from "next"

import { DisplayScreen } from "@/components/display/lobby-screen"
import { labels } from "@/lib/labels"

export const metadata: Metadata = {
  title: labels.halaman.judul,
  description: labels.halaman.deskripsi,
}

export default function DisplayPage() {
  return <DisplayScreen />
}
