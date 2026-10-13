import "server-only";
import { ok } from "@/server/http/response";
import * as dashboardService from "@/server/services/dashboard.service";
import { toDashboardResource } from "@/server/resources/dashboard.resource";

export async function show(_request: Request): Promise<Response> {
  const data = await dashboardService.getDashboardData();
  return ok(toDashboardResource(data));
}
