import "server-only";

import { z } from "zod";

import type { ApiError } from "@/domain/types";

import { BadRequestError, NotFoundError } from "./errors";

function errorResponse(status: number, code: string, message: string): Response {
  const body: ApiError = { error: { code, message } };
  return Response.json(body, { status });
}

/**
 * Wraps a route handler so every route reports failures in the same `{ error: { code, message } }`
 * shape and never leaks internals.
 */
export async function respond<T>(handler: () => Promise<T>): Promise<Response> {
  try {
    return Response.json(await handler());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(400, "invalid_request", error.issues.map((issue) => issue.message).join("; "));
    }
    if (error instanceof BadRequestError) return errorResponse(400, "invalid_request", error.message);
    if (error instanceof NotFoundError) return errorResponse(404, "not_found", error.message);

    console.error("[api] unexpected error", error);
    return errorResponse(502, "upstream_error", "Could not read from the network. Please try again.");
  }
}
