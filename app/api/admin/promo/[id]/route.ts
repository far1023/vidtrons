import { withHandler } from "@/server/middleware/with-handler";
import { withAuth } from "@/server/middleware/with-auth";
import * as promoController from "@/server/controllers/promo.controller";

export const GET = withHandler(withAuth(promoController.show));
export const PATCH = withHandler(withAuth(promoController.update));
export const DELETE = withHandler(withAuth(promoController.destroy));
