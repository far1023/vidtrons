import "server-only";
import { validateJson, validateIdParam, type RouteContext } from "./base";
import {
  createAgendaSchema,
  updateAgendaSchema,
  type CreateAgendaInput,
  type UpdateAgendaInput,
} from "@/lib/schemas/agenda.schema";

export { validateIdParam, type RouteContext };

export async function parseStoreAgendaRequest(
  request: Request
): Promise<CreateAgendaInput> {
  return validateJson(request, createAgendaSchema, "Validasi data agenda gagal");
}

export async function parseUpdateAgendaRequest(
  request: Request
): Promise<UpdateAgendaInput> {
  return validateJson(request, updateAgendaSchema, "Validasi pembaruan agenda gagal");
}
