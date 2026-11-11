import { withHandler } from "@/server/middleware/with-handler"
import { withAuth } from "@/server/middleware/with-auth"
import * as regionController from "@/server/controllers/region.controller"

export const GET = withHandler(withAuth(regionController.index))
export const POST = withHandler(withAuth(regionController.store))
