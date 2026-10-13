import "server-only";
import { ok } from "@/server/http/response";
import * as displayService from "@/server/services/display.service";

export async function show(_request: Request): Promise<Response> {
  const feed = await displayService.getDisplayFeed();
  return ok(feed);
}
