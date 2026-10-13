import { withHandler } from "@/server/middleware/with-handler";
import * as displayController from "@/server/controllers/display.controller";

export const GET = withHandler(displayController.show);
