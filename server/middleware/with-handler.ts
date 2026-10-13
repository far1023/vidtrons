import "server-only";
import { errorResponse } from "@/server/http/response";

export type RouteHandler<TContext = unknown> = (
  request: Request,
  context: TContext
) => Promise<Response> | Response;

/**
 * Higher-order function that wraps a route handler with standardized error handling.
 * Unhandled exceptions or thrown AppErrors are intercepted and returned as structured JSON responses.
 */
export function withHandler<TContext = unknown>(
  handler: RouteHandler<TContext>
): RouteHandler<TContext> {
  return async (request: Request, context: TContext) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return errorResponse(error);
    }
  };
}
