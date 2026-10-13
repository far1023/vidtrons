import "server-only";
import { ok, created, noContent } from "@/server/http/response";
import { validateIdParam, type RouteContext } from "@/server/requests/base";
import {
  getCurrentUserId,
  parseStoreUserRequest,
  parseUpdateUserRequest,
} from "@/server/requests/user.request";
import * as userService from "@/server/services/user.service";
import {
  toUserResource,
  toUserCollection,
} from "@/server/resources/user.resource";

export async function index(_request: Request): Promise<Response> {
  const items = await userService.getAllUsers();
  return ok(toUserCollection(items));
}

export async function show(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context);
  const item = await userService.getUserById(id);
  return ok(toUserResource(item));
}

export async function store(request: Request): Promise<Response> {
  const input = await parseStoreUserRequest(request);
  const createdItem = await userService.createUser(input);
  return created(toUserResource(createdItem));
}

export async function update(
  request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context);
  const data = await parseUpdateUserRequest(request);
  const updatedItem = await userService.updateUser(id, data);
  return ok(toUserResource(updatedItem));
}

export async function destroy(
  request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context);
  const currentUserId = await getCurrentUserId(request);
  await userService.deleteUser(id, currentUserId);
  return noContent();
}
