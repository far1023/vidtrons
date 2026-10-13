import "server-only";
import { getTodayDateString } from "@/lib/config";
import * as dashboardModel from "@/server/models/dashboard.model";

const LIST_LIMIT = 5;

export async function getDashboardData() {
  // All date logic uses DASHBOARD_TIMEZONE, never the server's local time.
  const today = getTodayDateString();

  const [stats, totalPengguna, agendaMendatang, pengumumanTerbaru] =
    await Promise.all([
      dashboardModel.contentCounts(),
      dashboardModel.userTotal(),
      dashboardModel.upcomingAgenda(today, LIST_LIMIT),
      dashboardModel.latestPengumuman(LIST_LIMIT),
    ]);

  return { today, stats, totalPengguna, agendaMendatang, pengumumanTerbaru };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
