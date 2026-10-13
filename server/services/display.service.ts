import "server-only";
import { unstable_cache } from "next/cache";
import { DISPLAY_CACHE_TAG } from "@/lib/constants";
import { getTodayDateString } from "@/lib/config";
import * as settingModel from "@/server/models/setting.model";
import * as runningTextModel from "@/server/models/running-text.model";
import * as pengumumanModel from "@/server/models/pengumuman.model";
import * as agendaModel from "@/server/models/agenda.model";
import * as promoModel from "@/server/models/promo.model";
import * as videoModel from "@/server/models/video.model";
import * as makroEkonomiModel from "@/server/models/makro-ekonomi.model";
import { toDisplayResource, type DisplayFeedData } from "@/server/resources/display.resource";

async function fetchRawDisplayFeed(todayDateStr: string): Promise<DisplayFeedData> {
  const [
    settingsMap,
    runningTexts,
    pengumumanList,
    agendaList,
    promos,
    videos,
    makroEkonomiList,
  ] = await Promise.all([
    settingModel.getMap(),
    runningTextModel.active(),
    pengumumanModel.activeWithKategori(),
    agendaModel.today(todayDateStr),
    promoModel.active(),
    videoModel.active(),
    makroEkonomiModel.active(),
  ]);

  return toDisplayResource({
    settingsMap,
    runningTexts,
    pengumumanList,
    agendaList,
    promos,
    videos,
    makroEkonomiList,
  });
}

/**
 * Cached fetcher for the display feed (Next.js Data Cache).
 * Tagged with DISPLAY_CACHE_TAG and keyed by the current date in the configured timezone.
 */
const getCachedFeed = unstable_cache(
  async (dateStr: string) => fetchRawDisplayFeed(dateStr),
  [DISPLAY_CACHE_TAG],
  {
    tags: [DISPLAY_CACHE_TAG],
  }
);

export async function getDisplayFeed(): Promise<DisplayFeedData> {
  const todayDateStr = getTodayDateString();

  // In development, always fetch fresh data so direct DB changes/seeds are immediately visible
  if (process.env.NODE_ENV === "development") {
    return fetchRawDisplayFeed(todayDateStr);
  }

  try {
    return await getCachedFeed(todayDateStr);
  } catch (error) {
    // If running in an environment without incrementalCache (e.g. standalone test scripts), fallback to raw fetch
    if (
      error instanceof Error &&
      (error.message.includes("static generation store missing") ||
        error.message.includes("incrementalCache missing"))
    ) {
      return fetchRawDisplayFeed(todayDateStr);
    }
    throw error;
  }
}
