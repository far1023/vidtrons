import "server-only"
import Pusher from "pusher"
import {
  PUSHER_DISPLAY_CHANNEL,
  PUSHER_PANEL_UPDATE_EVENT,
  type DisplayPanelKey,
} from "@/lib/constants"
import { revalidateDisplayCache } from "@/server/services/cache"
import { getPanelFeed } from "@/server/services/display.service"

/**
 * Pusher message size limit is about 10 KB. If the payload is larger (e.g.
 * a video playlist with long presigned URLs), the data is omitted and the screen
 * fetches that panel itself via /api/display?panel=...
 */
const PUSHER_MAX_PAYLOAD_BYTES = 8_000

let pusherInstance: Pusher | null = null

function getPusherServer(): Pusher | null {
  if (pusherInstance) return pusherInstance

  const appId = process.env.PUSHER_APP_ID
  const key = process.env.PUSHER_KEY
  const secret = process.env.PUSHER_SECRET
  const cluster = process.env.PUSHER_CLUSTER || "ap1"

  if (!appId || !key || !secret) {
    return null
  }

  pusherInstance = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  })

  return pusherInstance
}

/**
 * Triggers a realtime update for a specific display panel via Pusher,
 * and revalidates the Next.js cache.
 *
 * Payload sent to Pusher:
 * {
 *   panel: "pengumuman",
 *   data: [...],
 *   updatedAt: "2026-10-14T..."
 * }
 */
export async function broadcastPanelUpdate(
  panel: DisplayPanelKey
): Promise<void> {
  // Always revalidate display cache tag so SSR and fallback polling are updated
  revalidateDisplayCache()

  const pusher = getPusherServer()
  if (!pusher) {
    console.warn(
      `[Pusher Server] Broadcast panel '${panel}' dilewati: PUSHER_APP_ID, PUSHER_KEY, atau PUSHER_SECRET belum terisi di .env.local`
    )
    return
  }

  try {
    const data = await getPanelFeed(panel)
    const updatedAt = new Date().toISOString()
    const fullPayload = { panel, data, updatedAt }
    const fitsLimit =
      Buffer.byteLength(JSON.stringify(fullPayload)) <= PUSHER_MAX_PAYLOAD_BYTES

    if (!fitsLimit) {
      console.warn(
        `[Pusher Server] Payload panel '${panel}' melebihi batas; event dikirim tanpa data, layar akan mengambilnya sendiri.`
      )
    }

    await pusher.trigger(
      PUSHER_DISPLAY_CHANNEL,
      PUSHER_PANEL_UPDATE_EVENT,
      fitsLimit ? fullPayload : { panel, updatedAt }
    )
    console.log(
      `[Pusher Server] Sukses memancarkan event '${PUSHER_PANEL_UPDATE_EVENT}' untuk panel '${panel}' ke channel '${PUSHER_DISPLAY_CHANNEL}'`
    )
  } catch (error) {
    console.error(
      `[Pusher Server] Gagal mengirim broadcast update panel '${panel}':`,
      error
    )
  }
}
