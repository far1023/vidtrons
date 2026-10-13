import "server-only";
import { ok, created, noContent } from "@/server/http/response";
import { validateIdParam, type RouteContext } from "@/server/requests/base";
import {
  parseStoreRunningTextRequest,
  parseUpdateRunningTextRequest,
} from "@/server/requests/running-text.request";
import * as runningTextService from "@/server/services/running-text.service";
import {
  toRunningTextResource,
  toRunningTextCollection,
} from "@/server/resources/running-text.resource";

export async function index(_request: Request): Promise<Response> {
  const items = await runningTextService.getAllRunningTexts();
  return ok(toRunningTextCollection(items));
}

export async function show(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context);
  const item = await runningTextService.getRunningTextById(id);
  return ok(toRunningTextResource(item));
}

export async function store(request: Request): Promise<Response> {
  const input = await parseStoreRunningTextRequest(request);
  const createdItem = await runningTextService.createRunningText(input);
  return created(toRunningTextResource(createdItem));
}

export async function update(
  request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context);
  const data = await parseUpdateRunningTextRequest(request);
  const updatedItem = await runningTextService.updateRunningText(id, data);
  return ok(toRunningTextResource(updatedItem));
}

export async function destroy(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context);
  await runningTextService.deleteRunningText(id);
  return noContent();
}
