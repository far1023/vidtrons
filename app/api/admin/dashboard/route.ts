import { withHandler } from "@/server/middleware/with-handler";
import { withAuth } from "@/server/middleware/with-auth";
import * as dashboardController from "@/server/controllers/dashboard.controller";

export const GET = withHandler(withAuth(dashboardController.show));
