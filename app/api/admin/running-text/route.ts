import { withHandler } from "@/server/middleware/with-handler";
import { withAuth } from "@/server/middleware/with-auth";
import * as runningTextController from "@/server/controllers/running-text.controller";

export const GET = withHandler(withAuth(runningTextController.index));
export const POST = withHandler(withAuth(runningTextController.store));
