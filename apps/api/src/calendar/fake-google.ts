import { createServer, type IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";

export type Recorded = { method: string; path: string; body: string };
type FakeEvent = { calendarId: string; status: string; body: Record<string, unknown> };

// Tests only: a stand-in for Google's OAuth and Calendar endpoints on a local port (CALENDAR_GOOGLE_BASE).
// It hands out tokens, keeps events and serves busy times, and can be told to revoke access or fail.
export async function fakeGoogle() {
  const state = {
    requests: [] as Recorded[],
    events: new Map<string, FakeEvent>(),
    busy: [] as { start: string; end: string }[],
    calendars: [
      { id: "jaka@example.com", summary: "jaka@example.com", primary: true, accessRole: "owner" },
      { id: "lab@group.calendar.google.com", summary: "Lab", accessRole: "writer" },
    ],
    scope: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly",
    revoked: false,
    // Every Calendar api call answers with this status while set.
    failWith: undefined as number | undefined,
    accessTokens: new Set<string>(),
  };
  let issued = 0;

  const read = (req: IncomingMessage) =>
    new Promise<string>((resolve) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => resolve(data));
    });

  const server = createServer(async (req, res) => {
    const url = new URL(req.url!, "http://fake");
    const body = await read(req);
    state.requests.push({ method: req.method!, path: url.pathname, body });
    const send = (status: number, json?: unknown) => {
      res.writeHead(status, json === undefined ? {} : { "content-type": "application/json" });
      res.end(json === undefined ? undefined : JSON.stringify(json));
    };
    const tokens = (refresh: boolean) => {
      const access = `access-${++issued}`;
      state.accessTokens.add(access);
      return { access_token: access, expires_in: 3600, scope: state.scope, token_type: "Bearer", ...(refresh ? { refresh_token: "refresh-secret" } : {}) };
    };

    if (url.pathname === "/token") {
      const form = new URLSearchParams(body);
      if (form.get("grant_type") === "authorization_code") return form.get("code") === "good-code" ? send(200, tokens(true)) : send(400, { error: "invalid_grant" });
      if (state.revoked || form.get("refresh_token") !== "refresh-secret") return send(400, { error: "invalid_grant" });
      return send(200, tokens(false));
    }
    if (url.pathname === "/revoke") return send(200, {});

    const token = req.headers.authorization?.replace("Bearer ", "");
    if (state.revoked || !token || !state.accessTokens.has(token)) return send(401, { error: { code: 401 } });
    if (state.failWith) return send(state.failWith, { error: { code: state.failWith } });

    const path = url.pathname.replace(/^\/calendar\/v3/, "");
    if (path === "/users/me/calendarList") return send(200, { items: state.calendars });
    if (path === "/freeBusy") {
      const { items } = JSON.parse(body) as { items: { id: string }[] };
      return send(200, { calendars: Object.fromEntries(items.map((i, n) => [i.id, { busy: n === 0 ? state.busy : [] }])) });
    }
    const match = /^\/calendars\/([^/]+)\/events(?:\/([^/]+))?$/.exec(path);
    if (match) {
      const calendarId = decodeURIComponent(match[1]!);
      const id = match[2];
      if (req.method === "POST") {
        const event = JSON.parse(body) as Record<string, unknown>;
        if (state.events.has(event.id as string)) return send(409, { error: { code: 409 } });
        state.events.set(event.id as string, { calendarId, status: "confirmed", body: event });
        return send(200, event);
      }
      const existing = id ? state.events.get(id) : undefined;
      if (!existing || existing.calendarId !== calendarId) return send(404, { error: { code: 404 } });
      if (req.method === "PATCH") {
        existing.body = { ...existing.body, ...(JSON.parse(body) as Record<string, unknown>) };
        existing.status = "confirmed";
        return send(200, existing.body);
      }
      if (req.method === "DELETE") {
        if (existing.status === "cancelled") return send(410, { error: { code: 410 } });
        existing.status = "cancelled";
        return send(204);
      }
    }
    send(404, { error: { code: 404 } });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const live = () => [...state.events.entries()].filter(([, e]) => e.status === "confirmed");
  return {
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    state,
    live,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
