export interface DisplayFeedData {
  setting: {
    namaInstansi: string;
    slogan: string;
    logoUrl: string | null;
    makroQrUrl?: string | null;
    makroQrLabel?: string | null;
  };
  runningText: Array<{
    id: number;
    isi: string;
  }>;
  pengumuman: Array<{
    id: number;
    judul: string;
    tanggal: string;
    kategori: {
      nama: string;
      warna: string;
    } | null;
  }>;
  agenda: Array<{
    id: number;
    judul: string;
    mulai: string;
    selesai: string;
    lokasi: string;
    tanggal: string;
  }>;
  promo: Array<{
    id: number;
    judul: string;
    gambarUrl: string;
    urutan: number;
  }>;
  video: Array<{
    id: number;
    judul: string;
    url: string;
    urutan: number;
  }>;
  makroEkonomi: Array<{
    id: number;
    judul: string;
    nilai: string;
    satuan: string;
    tahun: string;
    tren: "naik_positif" | "turun_positif" | "turun_negatif" | "naik_negatif" | "tetap" | "naik" | "turun";
    urutan: number;
  }>;
}
