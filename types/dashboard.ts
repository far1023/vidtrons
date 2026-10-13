export interface ContentStat {
  total: number;
  active: number;
}

export interface DashboardOverview {
  /** Today's date (YYYY-MM-DD) in the configured timezone. */
  today: string;
  stats: {
    pengumuman: ContentStat;
    agenda: ContentStat;
    runningText: ContentStat;
    promo: ContentStat;
    video: ContentStat;
    makroEkonomi: ContentStat;
  };
  totalPengguna: number;
  agendaMendatang: Array<{
    id: number;
    judul: string;
    tanggal: string;
    /** HH:mm */
    mulai: string;
    /** HH:mm */
    selesai: string;
    lokasi: string;
  }>;
  pengumumanTerbaru: Array<{
    id: number;
    judul: string;
    tanggal: string;
    kategori: { nama: string; warna: string } | null;
  }>;
}
