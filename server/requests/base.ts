import "server-only";
import { z } from "zod";
import { ValidationError } from "@/server/errors/app-error";

export type RouteContext = {
  params?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

export const defaultIdSchema = z.coerce
  .number({
    error: (issue) => (issue.input === undefined ? "ID wajib diisi" : "ID harus berupa angka"),
  })
  .int("ID harus berupa bilangan bulat")
  .positive("ID harus berupa angka positif");

/**
 * Formats Zod validation issues into a consistent Record<string, string[]> format.
 */
export function formatZodIssues(issues: z.ZodIssue[]): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = issue.path.join(".") || "root";
    if (!fields[key]) {
      fields[key] = [];
    }
    fields[key].push(issue.message);
  }
  return fields;
}

/**
 * Safely parses JSON body from Request, throwing a consistent ValidationError if invalid.
 */
export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("Format JSON tidak valid atau request body kosong");
  }
}

/**
 * Validates request JSON body against a given Zod schema.
 */
export async function validateJson<T>(
  request: Request,
  schema: z.ZodType<T>,
  errorMessage = "Validasi data request gagal"
): Promise<T> {
  const body = await parseJsonBody(request);
  const result = schema.safeParse(body);

  if (!result.success) {
    throw new ValidationError(errorMessage, formatZodIssues(result.error.issues));
  }

  return result.data;
}

/**
 * Validates a route parameter (e.g. `id`) from Next.js async route context.
 */
export async function validateRouteParam<T>(
  context: RouteContext,
  paramName: string,
  schema: z.ZodType<T>,
  errorMessage = "Parameter URL tidak valid"
): Promise<T> {
  const resolvedParams = context.params ? await context.params : {};
  const rawValue = resolvedParams?.[paramName];

  const result = schema.safeParse(rawValue);
  if (!result.success) {
    throw new ValidationError(errorMessage, formatZodIssues(result.error.issues));
  }

  return result.data;
}

/**
 * Validates the standard numerical `id` route parameter.
 */
export async function validateIdParam(
  context: RouteContext,
  errorMessage = "Parameter ID tidak valid"
): Promise<number> {
  return validateRouteParam(context, "id", defaultIdSchema, errorMessage);
}

/**
 * Validates query parameters from request URL.
 */
export function validateQueryParams<T>(
  request: Request,
  schema: z.ZodType<T>,
  errorMessage = "Parameter query tidak valid"
): T {
  const url = new URL(request.url);
  const queryObj = Object.fromEntries(url.searchParams.entries());
  const result = schema.safeParse(queryObj);

  if (!result.success) {
    throw new ValidationError(errorMessage, formatZodIssues(result.error.issues));
  }

  return result.data;
}
