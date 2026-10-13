import { withHandler } from "@/server/middleware/with-handler";
import { withAuth } from "@/server/middleware/with-auth";
import * as kategoriController from "@/server/controllers/kategori.controller";

export const GET = withHandler(withAuth(kategoriController.index));
export const POST = withHandler(withAuth(kategoriController.store));
