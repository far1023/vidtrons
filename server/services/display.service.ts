import "server-only";
import { unstable_cache } from "next/cache";
import { DISPLAY_CACHE_TAG } from "@/lib/constants";
import { getTodayDateString, getDateOffsetString } from "@/lib/config";
import * as settingModel from "@/server/models/setting.model";
import * as runningTextModel from "@/server/models/running-text.model";
import * as pengumumanModel from "@/server/models/pengumuman.model";
import * as agendaModel from "@/server/models/agenda.model";
import * as promoModel from "@/server/models/promo.model";
import * as videoModel from "@/server/models/video.model";
import * as makroEkonomiModel from "@/server/models/makro-ekonomi.model";
import { toDisplayResource, type DisplayFeedData } from "@/server/resources/display.resource";
import { resolveVideoUrl } from "@/server/services/s3.service";

/**
 * Signs private bucket video URLs. Done OUTSIDE unstable_cache
 * (the cache only stores original URLs), so presigned URLs are not stored
 * and then expire inside the cache.
 */
async function signVideos<T extends { url: string }>(videos: T[]): Promise<T[]> {
  return Promise.all(
    videos.map(async (v) => ({ ...v, url: await resolveVideoUrl(v.url) }))
  );
}

async function fetchRawDisplayFeed(todayDateStr: string): Promise<DisplayFeedData> {
  const endDateStr = getDateOffsetString(7);
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
    agendaModel.upcoming(todayDateStr, endDateStr),
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

async function loadDisplayFeed(): Promise<DisplayFeedData> {
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

export async function getDisplayFeed(): Promise<DisplayFeedData> {
  const feed = await loadDisplayFeed();
  // Spread creates a new object, so cached data is not mutated
  return { ...feed, video: await signVideos(feed.video) };
}

/**
 * Fetches data for only a specific panel.
 * Used for targeted realtime Pusher payloads and single-panel API requests.
 */
export async function getPanelFeed(panel: string): Promise<unknown> {
  switch (panel) {
    case "pengumuman": {
      const list = await pengumumanModel.activeWithKategori();
      return list.map((p) => ({
        id: p.id,
        judul: p.judul,
        tanggal: p.tanggal,
        kategori: p.kategoriNama
          ? {
              nama: p.kategoriNama,
              warna: p.kategoriWarna || "#10b981",
            }
          : null,
      }));
    }
    case "agenda": {
      const todayDateStr = getTodayDateString();
      const endDateStr = getDateOffsetString(7);
      const list = await agendaModel.upcoming(todayDateStr, endDateStr);
      return list.map((a) => ({
        id: a.id,
        judul: a.judul,
        mulai: a.mulai,
        selesai: a.selesai,
        lokasi: a.lokasi,
        tanggal: a.tanggal,
      }));
    }
    case "runningText":
    case "running-text": {
      const list = await runningTextModel.active();
      return list.map((r) => ({
        id: r.id,
        isi: r.isi,
      }));
    }
    case "promo": {
      const list = await promoModel.active();
      return list.map((pr) => ({
        id: pr.id,
        judul: pr.judul,
        gambarUrl: pr.gambarUrl,
        urutan: pr.urutan,
      }));
    }
    case "video": {
      const list = await videoModel.active();
      return signVideos(
        list.map((v) => ({
          id: v.id,
          judul: v.judul,
          url: v.url,
          urutan: v.urutan,
        }))
      );
    }
    case "makroEkonomi":
    case "makro-ekonomi": {
      const list = await makroEkonomiModel.active();
      return list.map((m) => ({
        id: m.id,
        judul: m.judul,
        nilai: m.nilai,
        satuan: m.satuan,
        tahun: m.tahun,
        tren: (m.tren as "naik" | "turun" | "tetap") || "tetap",
        urutan: m.urutan,
      }));
    }
    case "setting": {
      const map = await settingModel.getMap();
      return {
        namaInstansi: map.namaInstansi || "Bappeda Kota Dumai",
        slogan: map.slogan || "Mewujudkan Dumai Kota IDAMAN",
        logoUrl: map.logoUrl || null,
        makroQrUrl: map.makroQrUrl || null,
        makroQrLabel: map.makroQrLabel || null,
      };
    }
    default:
      return undefined;
  }
}