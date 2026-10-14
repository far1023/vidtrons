import "server-only";
import { ok } from "@/server/http/response";
import * as displayService from "@/server/services/display.service";

export async function show(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const panel = url.searchParams.get("panel");

  if (panel) {
    const panelData = await displayService.getPanelFeed(panel);
    if (panelData !== undefined) {
      return ok({ panel, data: panelData });
    }
  }

  const feed = await displayService.getDisplayFeed();
  return ok(feed);
}
