import { withHandler } from "@/server/middleware/with-handler";
import { withAuth } from "@/server/middleware/with-auth";
import * as makroEkonomiController from "@/server/controllers/makro-ekonomi.controller";

export const GET = withHandler(withAuth(makroEkonomiController.index));
export const POST = withHandler(withAuth(makroEkonomiController.store));
