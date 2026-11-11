import { withHandler } from "@/server/middleware/with-handler"
import { withAuth } from "@/server/middleware/with-auth"
import * as regionController from "@/server/controllers/region.controller"

export const GET = withHandler(withAuth(regionController.show))
export const PUT = withHandler(withAuth(regionController.update))
export const PATCH = withHandler(withAuth(regionController.update))
export const DELETE = withHandler(withAuth(regionController.destroy))
