import { z } from "zod";
import type { CalendarConfig } from "./config";

// Google's OAuth and Calendar REST endpoints with plain fetch. Nothing here logs: bodies hold tokens.

export const scopes = ["https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/calendar.readonly"];

// A failed call. revoked: Google refused the refresh token (the coach removed our access), so we stop and ask to
// reconnect. A 401 on the api means the access token was refused; a fresh one may still work.
export class GoogleError extends Error {
  constructor(
    readonly status: number,
    readonly revoked = false,
  ) {
    super(`google calendar request failed (${status})`);
  }
}

const timeoutMs = 5000;

async function call<S extends z.ZodType>(url: string, init: RequestInit, schema: S): Promise<z.infer<S>> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: unknown } | null;
    throw new GoogleError(res.status, body?.error === "invalid_grant");
  }
  const text = await res.text();
  return schema.parse(text ? JSON.parse(text) : {});
}

const form = (fields: Record<string, string>) => ({
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams(fields).toString(),
});

const Tokens = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  refresh_token: z.string().optional(),
  scope: z.string().default(""),
});

export function authUrl(config: CalendarConfig, state: string) {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: scopes.join(" "),
    // A refresh token every time, also when the coach connected before.
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `${config.authUrl}?${params}`;
}

export const exchangeCode = (config: CalendarConfig, code: string) =>
  call(
    `${config.oauthUrl}/token`,
    form({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
    Tokens,
  );

export const refreshAccess = (config: CalendarConfig, refreshToken: string) =>
  call(
    `${config.oauthUrl}/token`,
    form({ refresh_token: refreshToken, client_id: config.clientId, client_secret: config.clientSecret, grant_type: "refresh_token" }),
    Tokens,
  );

export const revoke = (config: CalendarConfig, token: string) => call(`${config.oauthUrl}/revoke`, form({ token }), z.unknown());

const api = (config: CalendarConfig, token: string, path: string, init: RequestInit = {}) => ({
  url: `${config.apiUrl}${path}`,
  init: {
    ...init,
    headers: { authorization: `Bearer ${token}`, ...(init.body ? { "content-type": "application/json" } : {}) },
  },
});

const CalendarList = z.object({
  items: z
    .array(z.object({ id: z.string(), summary: z.string().default(""), primary: z.boolean().optional(), accessRole: z.string() }))
    .default([]),
});

// Calendars the coach can put events in.
export async function listCalendars(config: CalendarConfig, token: string) {
  const { url, init } = api(config, token, "/users/me/calendarList?minAccessRole=writer");
  return (await call(url, init, CalendarList)).items;
}

const FreeBusy = z.object({
  calendars: z.record(
    z.string(),
    z.object({ busy: z.array(z.object({ start: z.string(), end: z.string() })).default([]), errors: z.array(z.unknown()).optional() }),
  ),
});

// Busy intervals of the given calendars between two instants. Private events show only as busy time.
export async function freeBusy(config: CalendarConfig, token: string, calendarIds: string[], from: Date, to: Date) {
  const body = JSON.stringify({ timeMin: from.toISOString(), timeMax: to.toISOString(), items: calendarIds.map((id) => ({ id })) });
  const { url, init } = api(config, token, "/freeBusy", { method: "POST", body });
  const result = await call(url, init, FreeBusy);
  return Object.values(result.calendars).flatMap((c) => c.busy);
}

export type EventBody = {
  id: string;
  summary: string;
  location?: string;
  start: { dateTime: string };
  end: { dateTime: string };
  extendedProperties: { private: Record<string, string> };
  status?: "confirmed";
};

const events = (calendarId: string) => `/calendars/${encodeURIComponent(calendarId)}/events`;

export async function insertEvent(config: CalendarConfig, token: string, calendarId: string, event: EventBody) {
  const { url, init } = api(config, token, events(calendarId), { method: "POST", body: JSON.stringify(event) });
  await call(url, init, z.unknown());
}

// Also brings back a deleted event: Google keeps its id, and status "confirmed" restores it.
export async function patchEvent(config: CalendarConfig, token: string, calendarId: string, event: EventBody) {
  const { url, init } = api(config, token, `${events(calendarId)}/${event.id}`, {
    method: "PATCH",
    body: JSON.stringify({ ...event, status: "confirmed" }),
  });
  await call(url, init, z.unknown());
}

export async function deleteEvent(config: CalendarConfig, token: string, calendarId: string, eventId: string) {
  const { url, init } = api(config, token, `${events(calendarId)}/${eventId}`, { method: "DELETE" });
  await call(url, init, z.unknown());
}
