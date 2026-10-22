// proxy.ts sets this on every page request: the path and query asked for, e.g. /sl/account/privacy/delete?token=….
// lib/session.ts reads it. Its own file, so the proxy doesn't pull in the server-only session code.
export const requestUrlHeader = "x-request-url";
