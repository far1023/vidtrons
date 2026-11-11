import { withHandler } from "@/server/middleware/with-handler";
import * as regionController from "@/server/controllers/region.controller";

export const GET = withHandler(regionController.publicIndex);

