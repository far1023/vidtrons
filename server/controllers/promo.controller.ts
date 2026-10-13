import "server-only";
import { ok, created, noContent } from "@/server/http/response";
import { validateIdParam, type RouteContext } from "@/server/requests/base";
import {
  parseStorePromoRequest,
  parseUpdatePromoRequest,
} from "@/server/requests/promo.request";
import * as promoService from "@/server/services/promo.service";
import {
  toPromoResource,
  toPromoCollection,
} from "@/server/resources/promo.resource";

export async function index(_request: Request): Promise<Response> {
  const items = await promoService.getAllPromo();
  return ok(toPromoCollection(items));
}

export async function show(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context);
  const item = await promoService.getPromoById(id);
  return ok(toPromoResource(item));
}

export async function store(request: Request): Promise<Response> {
  const input = await parseStorePromoRequest(request);
  const createdItem = await promoService.createPromo(input);
  return created(toPromoResource(createdItem));
}

export async function update(
  request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context);
  const data = await parseUpdatePromoRequest(request);
  const updatedItem = await promoService.updatePromo(id, data);
  return ok(toPromoResource(updatedItem));
}

export async function destroy(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context);
  await promoService.deletePromo(id);
  return noContent();
}
