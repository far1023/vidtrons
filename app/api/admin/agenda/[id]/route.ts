import { withHandler } from "@/server/middleware/with-handler";
import { withAuth } from "@/server/middleware/with-auth";
import * as agendaController from "@/server/controllers/agenda.controller";

export const GET = withHandler(withAuth(agendaController.show));
export const PATCH = withHandler(withAuth(agendaController.update));
export const DELETE = withHandler(withAuth(agendaController.destroy));
