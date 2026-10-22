import type { ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ApiErrorBody } from "@jakamarinko/api";

// Throw this from a route for an expected failure; the client gets { error: { code, message } }.
export class ApiError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const body = (code: string, message: string): ApiErrorBody => ({ error: { code, message } });

export const onError: ErrorHandler = (err, c) => {
  if (err instanceof ApiError) return c.json(body(err.code, err.message), err.status);
  if (err instanceof HTTPException) return c.json(body(`http_${err.status}`, err.message), err.status);
  // Only the stack: request bodies can hold health data and never go to the log.
  console.error(err instanceof Error ? err.stack : String(err));
  return c.json(body("internal", "Something went wrong"), 500);
};

export const notFound: NotFoundHandler = (c) => c.json(body("not_found", "Not found"), 404);
