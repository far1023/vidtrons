import { withHandler } from "@/server/middleware/with-handler";
import { withAuth } from "@/server/middleware/with-auth";
import * as runningTextController from "@/server/controllers/running-text.controller";

export const GET = withHandler(withAuth(runningTextController.show));
export const PATCH = withHandler(withAuth(runningTextController.update));
export const DELETE = withHandler(withAuth(runningTextController.destroy));
