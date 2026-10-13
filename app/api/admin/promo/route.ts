import { withHandler } from "@/server/middleware/with-handler";
import { withAuth } from "@/server/middleware/with-auth";
import * as promoController from "@/server/controllers/promo.controller";

export const GET = withHandler(withAuth(promoController.index));
export const POST = withHandler(withAuth(promoController.store));
