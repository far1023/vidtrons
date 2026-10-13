import "server-only";
import { ok, created, noContent } from "@/server/http/response";
import { validateIdParam, type RouteContext } from "@/server/requests/base";
import {
  parseStoreKategoriRequest,
  parseUpdateKategoriRequest,
} from "@/server/requests/kategori.request";
import * as kategoriService from "@/server/services/kategori.service";
import {
  toKategoriResource,
  toKategoriCollection,
} from "@/server/resources/kategori.resource";

export async function index(_request: Request): Promise<Response> {
  const items = await kategoriService.getAllKategori();
  return ok(toKategoriCollection(items));
}

export async function show(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context);
  const item = await kategoriService.getKategoriById(id);
  return ok(toKategoriResource(item));
}

export async function store(request: Request): Promise<Response> {
  const input = await parseStoreKategoriRequest(request);
  const createdItem = await kategoriService.createKategori(input);
  return created(toKategoriResource(createdItem));
}

export async function update(
  request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context);
  const data = await parseUpdateKategoriRequest(request);
  const updatedItem = await kategoriService.updateKategori(id, data);
  return ok(toKategoriResource(updatedItem));
}

export async function destroy(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context);
  await kategoriService.deleteKategori(id);
  return noContent();
}
