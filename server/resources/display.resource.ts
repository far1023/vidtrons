import "server-only";
import type { DisplayFeedData } from "@/types/display";

export type { DisplayFeedData };

export function toDisplayResource(data: {
  settingsMap: Record<string, string>;
  runningTexts: Array<{ id: number; isi: string }>;
  pengumumanList: Array<{
    id: number;
    judul: string;
    tanggal: string;
    kategoriNama: string | null;
    kategoriWarna: string | null;
  }>;
  agendaList: Array<{
    id: number;
    judul: string;
    mulai: string;
    selesai: string;
    lokasi: string;
    tanggal: string;
  }>;
  promos: Array<{ id: number; judul: string; gambarUrl: string; urutan: number }>;
  videos: Array<{ id: number; judul: string; url: string; urutan: number }>;
  makroEkonomiList: Array<{
    id: number;
    judul: string;
    nilai: string;
    satuan: string;
    tahun: string;
    tren: string;
    urutan: number;
  }>;
}): DisplayFeedData {
  return {
    setting: {
      namaInstansi: data.settingsMap.namaInstansi || "Bappeda Kota Dumai",
      slogan: data.settingsMap.slogan || "Mewujudkan Dumai Kota IDAMAN",
      logoUrl: data.settingsMap.logoUrl || null,
      makroQrUrl: data.settingsMap.makroQrUrl || null,
      makroQrLabel: data.settingsMap.makroQrLabel || null,
    },
    runningText: data.runningTexts.map((r) => ({
      id: r.id,
      isi: r.isi,
    })),
    pengumuman: data.pengumumanList.map((p) => ({
      id: p.id,
      judul: p.judul,
      tanggal: p.tanggal,
      kategori: p.kategoriNama
        ? {
            nama: p.kategoriNama,
            warna: p.kategoriWarna || "#10b981",
          }
        : null,
    })),
    agenda: data.agendaList.map((a) => ({
      id: a.id,
      judul: a.judul,
      mulai: a.mulai,
      selesai: a.selesai,
      lokasi: a.lokasi,
      tanggal: a.tanggal,
    })),
    promo: data.promos.map((pr) => ({
      id: pr.id,
      judul: pr.judul,
      gambarUrl: pr.gambarUrl,
      urutan: pr.urutan,
    })),
    // URL asli disimpan apa adanya; presigned URL dibuat di display.service
    // (di luar cache) lewat resolveVideoUrl.
    video: data.videos.map((v) => ({
      id: v.id,
      judul: v.judul,
      url: v.url,
      urutan: v.urutan,
    })),
    makroEkonomi: data.makroEkonomiList.map((m) => ({
      id: m.id,
      judul: m.judul,
      nilai: m.nilai,
      satuan: m.satuan,
      tahun: m.tahun,
      tren: (m.tren as "naik" | "turun" | "tetap") || "tetap",
      urutan: m.urutan,
    })),
  };
}