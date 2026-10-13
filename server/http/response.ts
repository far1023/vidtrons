import "server-only";
import { NextResponse } from "next/server";
import { AppError, ValidationError } from "@/server/errors/app-error";

export interface ApiSuccessResponse<T> {
  data: T;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
}

export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ data }, { status: 200, ...init });
}

export function created<T>(data: T, init?: ResponseInit): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ data }, { status: 201, ...init });
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function errorResponse(error: unknown): NextResponse<ApiErrorResponse> {
  if (error instanceof AppError) {
    const body: ApiErrorResponse = {
      error: {
        code: error.code,
        message: error.message,
      },
    };

    if (error instanceof ValidationError && error.fields) {
      body.error.fields = error.fields;
    }

    return NextResponse.json(body, { status: error.statusCode });
  }

  // Generic message for unexpected errors to avoid leaking SQL or stack traces
  console.error("[UnhandledServerError]", error);

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Terjadi kesalahan internal pada server",
      },
    },
    { status: 500 }
  );
}
