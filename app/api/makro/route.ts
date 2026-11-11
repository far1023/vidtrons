import { withHandler } from "@/server/middleware/with-handler";
import * as makroEkonomiController from "@/server/controllers/makro-ekonomi.controller";

export const GET = withHandler(makroEkonomiController.publicGrafik);

