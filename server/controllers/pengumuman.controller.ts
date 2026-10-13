import "server-only";
import { ok, created, noContent } from "@/server/http/response";
import { validateIdParam, type RouteContext } from "@/server/requests/base";
import {
  parseStorePengumumanRequest,
  parseUpdatePengumumanRequest,
} from "@/server/requests/pengumuman.request";
import * as pengumumanService from "@/server/services/pengumuman.service";
import {
  toPengumumanResource,
  toPengumumanCollection,
} from "@/server/resources/pengumuman.resource";

export async function index(_request: Request): Promise<Response> {
  const items = await pengumumanService.getAllPengumuman();
  return ok(toPengumumanCollection(items));
}

export async function show(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context);
  const item = await pengumumanService.getPengumumanById(id);
  return ok(toPengumumanResource(item));
}

export async function store(request: Request): Promise<Response> {
  const input = await parseStorePengumumanRequest(request);
  const createdItem = await pengumumanService.createPengumuman(input);
  return created(toPengumumanResource(createdItem));
}

export async function update(
  request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context);
  const data = await parseUpdatePengumumanRequest(request);
  const updatedItem = await pengumumanService.updatePengumuman(id, data);
  return ok(toPengumumanResource(updatedItem));
}

export async function destroy(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context);
  await pengumumanService.deletePengumuman(id);
  return noContent();
}
