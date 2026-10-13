import { withHandler } from "@/server/middleware/with-handler";
import { withAuth } from "@/server/middleware/with-auth";
import * as kategoriController from "@/server/controllers/kategori.controller";

export const GET = withHandler(withAuth(kategoriController.show));
export const PATCH = withHandler(withAuth(kategoriController.update));
export const DELETE = withHandler(withAuth(kategoriController.destroy));
