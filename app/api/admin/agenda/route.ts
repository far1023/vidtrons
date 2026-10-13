import { withHandler } from "@/server/middleware/with-handler";
import { withAuth } from "@/server/middleware/with-auth";
import * as agendaController from "@/server/controllers/agenda.controller";

export const GET = withHandler(withAuth(agendaController.index));
export const POST = withHandler(withAuth(agendaController.store));
