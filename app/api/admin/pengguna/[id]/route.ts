import { withHandler } from "@/server/middleware/with-handler";
import { withAuth } from "@/server/middleware/with-auth";
import * as userController from "@/server/controllers/user.controller";

export const GET = withHandler(withAuth(userController.show));
export const PUT = withHandler(withAuth(userController.update));
export const PATCH = withHandler(withAuth(userController.update));
export const DELETE = withHandler(withAuth(userController.destroy));
