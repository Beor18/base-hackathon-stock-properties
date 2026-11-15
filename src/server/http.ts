import "server-only";

import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import type { ApiError } from "@/domain/types";

import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
  UnauthorizedError,
  UnavailableRegionError,
} from "./errors";

function errorResponse(status: number, code: string, message: string, contractError?: string): Response {
  const body: ApiError = { error: { code, message, ...(contractError ? { contractError } : {}) } };
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
    // Next signals dynamic rendering (and redirects) with internal errors: they are not failures.
    unstable_rethrow(error);
    if (error instanceof z.ZodError) {
      return errorResponse(400, "invalid_request", error.issues.map((issue) => issue.message).join("; "));
    }
    if (error instanceof BadRequestError) return errorResponse(400, error.code, error.message);
    if (error instanceof NotFoundError) return errorResponse(404, "not_found", error.message);
    if (error instanceof ConflictError) return errorResponse(409, error.code, error.message, error.contractError);
    if (error instanceof UnavailableRegionError) return errorResponse(451, "unavailable_region", error.message);
    if (error instanceof UnauthorizedError) return errorResponse(401, "unauthorized", error.message);
    if (error instanceof ForbiddenError) return errorResponse(403, error.code, error.message);
    if (error instanceof ServiceUnavailableError) {
      console.error("[api] unavailable", error.code, error.message);
      return errorResponse(503, error.code, error.message);
    }

    console.error("[api] unexpected error", error);
    return errorResponse(502, "upstream_error", "Could not read from the network. Please try again.");
  }
}

/** Reads a JSON body, failing as a 400 when it is missing or malformed. */
export async function readJson(request: Request): Promise<unknown> {
  return request.json().catch(() => {
    throw new BadRequestError("Expected a JSON body");
  });
}
