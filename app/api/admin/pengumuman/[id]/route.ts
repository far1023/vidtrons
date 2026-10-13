import { withHandler } from "@/server/middleware/with-handler";
import { withAuth } from "@/server/middleware/with-auth";
import * as pengumumanController from "@/server/controllers/pengumuman.controller";

export const GET = withHandler(withAuth(pengumumanController.show));
export const PATCH = withHandler(withAuth(pengumumanController.update));
export const DELETE = withHandler(withAuth(pengumumanController.destroy));
