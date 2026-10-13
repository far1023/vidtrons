import { withHandler } from "@/server/middleware/with-handler";
import { withAuth } from "@/server/middleware/with-auth";
import * as pengumumanController from "@/server/controllers/pengumuman.controller";

export const GET = withHandler(withAuth(pengumumanController.index));
export const POST = withHandler(withAuth(pengumumanController.store));
