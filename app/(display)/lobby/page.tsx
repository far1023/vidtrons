import type { Metadata } from "next"

import { DisplayScreen } from "@/components/display/lobby-screen"
import { labels } from "@/lib/labels"

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: labels.halaman.judul,
  description: labels.halaman.deskripsi,
}

export default function DisplayPage() {
  const pusherKey =
    process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.PUSHER_KEY || "";
  const pusherCluster =
    process.env.NEXT_PUBLIC_PUSHER_CLUSTER ||
    process.env.PUSHER_CLUSTER ||
    "ap1";

  return <DisplayScreen pusherKey={pusherKey} pusherCluster={pusherCluster} />;
}
