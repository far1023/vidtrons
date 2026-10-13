import "server-only";
import { getToken } from "next-auth/jwt";
import { UnauthorizedError } from "@/server/errors/app-error";
import type { RouteHandler } from "./with-handler";

const secret = process.env.NEXTAUTH_SECRET || "dev-secret-bppddmi-videotron-2026";

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const [name, ...val] = part.trim().split("=");
    if (name) {
      cookies[name] = decodeURIComponent(val.join("="));
    }
  }
  return cookies;
}

/** Reads and verifies the Auth.js JWT from the request cookies (null if absent/invalid). */
export async function readSessionToken(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  const reqAdapter = {
    headers: request.headers,
    cookies: (request as any).cookies ?? parseCookies(cookieHeader),
  };

  return getToken({
    req: reqAdapter as any,
    secret,
  });
}

/**
 * Middleware wrapper enforcing admin authentication.
 * Per docs/BACKEND.md, admin routes require a valid session.
 * In non-production environments, requests with `x-dev-test-auth: 1` can bypass the check for automated testing.
 */
export function withAuth<TContext = unknown>(
  handler: RouteHandler<TContext>
): RouteHandler<TContext> {
  return async (request: Request, context: TContext) => {
    const isDev = process.env.NODE_ENV !== "production";
    const devTestBypass = isDev && request.headers.get("x-dev-test-auth") === "1";

    if (devTestBypass) {
      return handler(request, context);
    }

    const token = await readSessionToken(request);

    if (!token) {
      throw new UnauthorizedError("Sesi admin tidak valid atau belum masuk");
    }

    return handler(request, context);
  };
}
