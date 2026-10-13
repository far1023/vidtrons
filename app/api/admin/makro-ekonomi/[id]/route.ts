import { withHandler } from "@/server/middleware/with-handler";
import { withAuth } from "@/server/middleware/with-auth";
import * as makroEkonomiController from "@/server/controllers/makro-ekonomi.controller";

export const GET = withHandler(withAuth(makroEkonomiController.show));
export const PUT = withHandler(withAuth(makroEkonomiController.update));
export const PATCH = withHandler(withAuth(makroEkonomiController.update));
export const DELETE = withHandler(withAuth(makroEkonomiController.destroy));
