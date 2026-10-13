import "server-only";
import { ok, created, noContent } from "@/server/http/response";
import { validateIdParam, type RouteContext } from "@/server/requests/base";
import {
  parseStoreVideoRequest,
  parseUpdateVideoRequest,
} from "@/server/requests/video.request";
import * as videoService from "@/server/services/video.service";
import {
  toVideoResource,
  toVideoCollection,
} from "@/server/resources/video.resource";

export async function index(_request: Request): Promise<Response> {
  const items = await videoService.getAllVideo();
  return ok(toVideoCollection(items));
}

export async function show(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context);
  const item = await videoService.getVideoById(id);
  return ok(toVideoResource(item));
}

export async function store(request: Request): Promise<Response> {
  const input = await parseStoreVideoRequest(request);
  const createdItem = await videoService.createVideo(input);
  return created(toVideoResource(createdItem));
}

export async function update(
  request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context);
  const data = await parseUpdateVideoRequest(request);
  const updatedItem = await videoService.updateVideo(id, data);
  return ok(toVideoResource(updatedItem));
}

export async function destroy(
  _request: Request,
  context: RouteContext
): Promise<Response> {
  const id = await validateIdParam(context);
  await videoService.deleteVideo(id);
  return noContent();
}
