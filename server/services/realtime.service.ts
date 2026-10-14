import "server-only";
import Pusher from "pusher";
import {
  PUSHER_DISPLAY_CHANNEL,
  PUSHER_PANEL_UPDATE_EVENT,
  type DisplayPanelKey,
} from "@/lib/constants";
import { revalidateDisplayCache } from "@/server/services/cache";
import { getPanelFeed } from "@/server/services/display.service";

let pusherInstance: Pusher | null = null;

function getPusherServer(): Pusher | null {
  if (pusherInstance) return pusherInstance;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER || "ap1";

  if (!appId || !key || !secret) {
    return null;
  }

  pusherInstance = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });

  return pusherInstance;
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
export async function broadcastPanelUpdate(panel: DisplayPanelKey): Promise<void> {
  // Always revalidate display cache tag so SSR and fallback polling are updated
  revalidateDisplayCache();

  const pusher = getPusherServer();
  if (!pusher) {
    console.warn(
      `[Pusher Server] Broadcast panel '${panel}' dilewati: PUSHER_APP_ID, PUSHER_KEY, atau PUSHER_SECRET belum terisi di .env.local`
    );
    return;
  }

  try {
    const data = await getPanelFeed(panel);
    await pusher.trigger(PUSHER_DISPLAY_CHANNEL, PUSHER_PANEL_UPDATE_EVENT, {
      panel,
      data,
      updatedAt: new Date().toISOString(),
    });
    console.log(
      `[Pusher Server] Sukses memancarkan event '${PUSHER_PANEL_UPDATE_EVENT}' untuk panel '${panel}' ke channel '${PUSHER_DISPLAY_CHANNEL}'`
    );
  } catch (error) {
    console.error(`[Pusher Server] Gagal mengirim broadcast update panel '${panel}':`, error);
  }
}
