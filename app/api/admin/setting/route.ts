import { withHandler } from "@/server/middleware/with-handler";
import { withAuth } from "@/server/middleware/with-auth";
import * as settingController from "@/server/controllers/setting.controller";

export const GET = withHandler(withAuth(settingController.show));
export const PATCH = withHandler(withAuth(settingController.update));
