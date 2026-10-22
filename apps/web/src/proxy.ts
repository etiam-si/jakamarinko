import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { requestUrlHeader } from "./lib/request-url";

const i18n = createMiddleware(routing);

// Redirects / to /en or /sl and keeps the language cookie. Also hands layouts the requested path and query
// (lib/request-url.ts), always set here so a client can't send its own.
export default function proxy(request: NextRequest) {
  request.headers.set(requestUrlHeader, request.nextUrl.pathname + request.nextUrl.search);
  return i18n(request);
}

export const config = {
  // Not for the api, Next internals or files with an extension (robots.txt, nacrt.html).
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
