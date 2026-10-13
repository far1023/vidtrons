import "server-only";
import type { DashboardData } from "@/server/services/dashboard.service";
import type { DashboardOverview } from "@/types/dashboard";

/** "08:30:00" -> "08:30" */
const toHourMinute = (value: string) => value.slice(0, 5);

export function toDashboardResource(data: DashboardData): DashboardOverview {
  return {
    today: data.today,
    stats: data.stats,
    totalPengguna: data.totalPengguna,
    agendaMendatang: data.agendaMendatang.map((row) => ({
      id: row.id,
      judul: row.judul,
      tanggal: row.tanggal,
      mulai: toHourMinute(row.mulai),
      selesai: toHourMinute(row.selesai),
      lokasi: row.lokasi,
    })),
    pengumumanTerbaru: data.pengumumanTerbaru.map((row) => ({
      id: row.id,
      judul: row.judul,
      tanggal: row.tanggal,
      kategori:
        row.kategoriNama && row.kategoriWarna
          ? { nama: row.kategoriNama, warna: row.kategoriWarna }
          : null,
    })),
  };
}
