import { withHandler } from "@/server/middleware/with-handler";
import { withAuth } from "@/server/middleware/with-auth";
import * as videoController from "@/server/controllers/video.controller";

export const GET = withHandler(withAuth(videoController.show));
export const PATCH = withHandler(withAuth(videoController.update));
export const DELETE = withHandler(withAuth(videoController.destroy));
