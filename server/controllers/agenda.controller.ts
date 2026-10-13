import "server-only";
import { ok, created, noContent } from "@/server/http/response";
import { validateIdParam, type RouteContext } from "@/server/requests/base";
import {
  parseStoreAgendaRequest,
  parseUpdateAgendaRequest,
} from "@/server/requests/agenda.request";
import * as agendaService from "@/server/services/agenda.service";
import {
  toAgendaResource,
  toAgendaCollection,
} from "@/server/resources/agenda.resource";

export async function index(_request: Request): Promise<Response> {
  const items = await agendaService.getAllAgenda();
  return ok(toAgendaCollection(items));
}

export async function show(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context);
  const item = await agendaService.getAgendaById(id);
  return ok(toAgendaResource(item));
}

export async function store(request: Request): Promise<Response> {
  const input = await parseStoreAgendaRequest(request);
  const createdItem = await agendaService.createAgenda(input);
  return created(toAgendaResource(createdItem));
}

export async function update(
  request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context);
  const data = await parseUpdateAgendaRequest(request);
  const updatedItem = await agendaService.updateAgenda(id, data);
  return ok(toAgendaResource(updatedItem));
}

export async function destroy(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context);
  await agendaService.deleteAgenda(id);
  return noContent();
}
