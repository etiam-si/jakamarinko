import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Redirects / to /en or /sl and keeps the language cookie.
export default createMiddleware(routing);

export const config = {
  // Not for the api, Next internals or files with an extension (robots.txt, nacrt.html).
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
