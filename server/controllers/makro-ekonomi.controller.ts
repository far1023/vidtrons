import "server-only";
import { ok, created, noContent } from "@/server/http/response";
import { validateIdParam, type RouteContext } from "@/server/requests/base";
import {
  parseStoreMakroEkonomiRequest,
  parseUpdateMakroEkonomiRequest,
} from "@/server/requests/makro-ekonomi.request";
import * as makroEkonomiService from "@/server/services/makro-ekonomi.service";
import {
  toMakroEkonomiResource,
  toMakroEkonomiCollection,
} from "@/server/resources/makro-ekonomi.resource";

export async function index(_request: Request): Promise<Response> {
  const items = await makroEkonomiService.getAllMakroEkonomi();
  return ok(toMakroEkonomiCollection(items));
}

export async function show(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context);
  const item = await makroEkonomiService.getMakroEkonomiById(id);
  return ok(toMakroEkonomiResource(item));
}

export async function store(request: Request): Promise<Response> {
  const input = await parseStoreMakroEkonomiRequest(request);
  const createdItem = await makroEkonomiService.createMakroEkonomi(input);
  return created(toMakroEkonomiResource(createdItem));
}

export async function update(
  request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context);
  const data = await parseUpdateMakroEkonomiRequest(request);
  const updatedItem = await makroEkonomiService.updateMakroEkonomi(id, data);
  return ok(toMakroEkonomiResource(updatedItem));
}

export async function destroy(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context);
  await makroEkonomiService.deleteMakroEkonomi(id);
  return noContent();
}
