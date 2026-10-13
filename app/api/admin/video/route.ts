import { withHandler } from "@/server/middleware/with-handler";
import { withAuth } from "@/server/middleware/with-auth";
import * as videoController from "@/server/controllers/video.controller";

export const GET = withHandler(withAuth(videoController.index));
export const POST = withHandler(withAuth(videoController.store));
