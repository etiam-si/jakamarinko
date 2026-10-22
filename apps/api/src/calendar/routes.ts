import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import {
  type CalendarChoice,
  type CalendarStatus,
  ConnectCalendarInput,
  type ConnectResult,
  UpdateCalendarInput,
} from "@jakamarinko/api";
import { getSessionUser, type SessionUser } from "@jakamarinko/auth";
import { db } from "@jakamarinko/db";
import { calendarConnections, calendarEvents } from "@jakamarinko/db/schema";
import { defaultLocale } from "@jakamarinko/types";
import { ownCoachId } from "../booking/coach";
import { requireRole } from "../lib/auth";
import { ApiError } from "../lib/errors";
import { validate } from "../lib/validate";
import { calendarConfig, type CalendarConfig } from "./config";
import { connectionOf, withGoogle, type Connection } from "./connection";
import { decrypt, encrypt, signState, verifyState } from "./crypto";
import { authUrl, exchangeCode, GoogleError, listCalendars, revoke, scopes } from "./google";
import { syncCalendars } from "./sync";

const staff = requireRole("coach");
const stateTtlMs = 10 * 60_000;

// A coach connects their own Google account; nobody connects someone else's.
async function ownCoach(user: SessionUser) {
  const coachId = await ownCoachId(user);
  if (!coachId) throw new ApiError(404, "not_a_coach", "You have no calendar");
  return coachId;
}

function requireConfig() {
  const config = calendarConfig();
  if (!config) throw new ApiError(503, "calendar_off", "Calendar sync is not set up on this server");
  return config;
}

async function requireConnection(coachId: string) {
  const conn = await connectionOf(coachId);
  if (!conn) throw new ApiError(404, "not_connected", "No calendar connected");
  if (conn.status !== "connected") throw new ApiError(409, "needs_reconnect", "Connect your calendar again");
  return conn;
}

// Google's answer as an api error: refused tokens mean reconnect, anything else is Google being unavailable.
async function google<T>(config: CalendarConfig, conn: Connection, run: (token: string) => Promise<T>) {
  try {
    return await withGoogle(config, conn, run);
  } catch (err) {
    if (!(err instanceof GoogleError)) throw err;
    if ((await connectionOf(conn.coachId))?.status === "needs_reconnect") throw new ApiError(409, "needs_reconnect", "Connect your calendar again");
    throw new ApiError(502, "google_unavailable", "Google Calendar didn't answer");
  }
}

const statusView = (conn: Connection | undefined, available: boolean): CalendarStatus => ({
  available,
  connection: conn
    ? {
        status: conn.status,
        account: conn.account,
        calendarId: conn.calendarId,
        calendarName: conn.calendarName,
        syncedAt: conn.busyFetchedAt?.toISOString() ?? null,
      }
    : null,
});

const CallbackQuery = z.object({ code: z.string().optional(), state: z.string().optional(), error: z.string().optional() });

// Busy times and pending bookings right after a change, in the background.
const syncNow = () => void syncCalendars().catch(() => {});

export const calendar = new Hono()
  .get("/", staff, async (c) => {
    const conn = await connectionOf(await ownCoach(c.get("user")));
    return c.json<CalendarStatus>(statusView(conn, !!calendarConfig()));
  })
  .post("/google/connect", staff, validate("json", ConnectCalendarInput), async (c) => {
    const config = requireConfig();
    const user = c.get("user");
    await ownCoach(user);
    const state = signState({ userId: user.id, locale: c.req.valid("json").locale, exp: Date.now() + stateTtlMs }, config.key);
    return c.json({ url: authUrl(config, state) });
  })
  // Google sends the browser here. Every outcome goes back to the settings page with ?result=.
  .get("/google/callback", validate("query", CallbackQuery), async (c) => {
    const config = calendarConfig();
    const query = c.req.valid("query");
    const state = config && query.state ? verifyState(query.state, config.key, new Date()) : null;
    const back = (result: ConnectResult) =>
      c.redirect(`${config?.siteUrl ?? ""}/${state?.locale ?? defaultLocale}/coach/settings/calendar?result=${result}`);
    if (!config || !state) return back("failed");
    const user = await getSessionUser(c.req.raw.headers);
    const coachId = user?.id === state.userId ? await ownCoachId(user) : undefined;
    if (!coachId) return back("failed");
    if (query.error) return back(query.error === "access_denied" ? "denied" : "failed");
    if (!query.code) return back("failed");

    try {
      const tokens = await exchangeCode(config, query.code);
      // With granular consent the coach can untick a scope; without both there is nothing to sync.
      const granted = tokens.scope.split(" ");
      if (!scopes.every((s) => granted.includes(s))) return back("scope");
      if (!tokens.refresh_token) return back("failed");
      const primary = (await listCalendars(config, tokens.access_token)).find((cal) => cal.primary);
      if (!primary) return back("failed");

      const before = await connectionOf(coachId);
      const sameAccount = before?.account === primary.id;
      const values = {
        coachId,
        account: primary.id,
        refreshToken: encrypt(tokens.refresh_token, config.key),
        accessToken: encrypt(tokens.access_token, config.key),
        accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        // Reconnecting the same account keeps the calendar chosen before.
        calendarId: sameAccount ? before.calendarId : primary.id,
        calendarName: sameAccount ? before.calendarName : primary.summary,
        status: "connected" as const,
        busy: [],
        busyFetchedAt: null,
      };
      await db().insert(calendarConnections).values(values).onConflictDoUpdate({ target: calendarConnections.coachId, set: values });
      // Events written to another account can't be reached any more; their bookings are written again.
      if (before && !sameAccount) await db().delete(calendarEvents).where(eq(calendarEvents.coachId, coachId));
    } catch (err) {
      if (err instanceof GoogleError) return back("failed");
      throw err;
    }
    syncNow();
    return back("connected");
  })
  .get("/calendars", staff, async (c) => {
    const config = requireConfig();
    const conn = await requireConnection(await ownCoach(c.get("user")));
    const items = await google(config, conn, (token) => listCalendars(config, token));
    return c.json<CalendarChoice[]>(items.map((cal) => ({ id: cal.id, name: cal.summary, primary: !!cal.primary })));
  })
  .put("/", staff, validate("json", UpdateCalendarInput), async (c) => {
    const config = requireConfig();
    const conn = await requireConnection(await ownCoach(c.get("user")));
    const { calendarId } = c.req.valid("json");
    const chosen = (await google(config, conn, (token) => listCalendars(config, token))).find((cal) => cal.id === calendarId);
    if (!chosen) throw new ApiError(400, "unknown_calendar", "That calendar can't take events");
    const [row] = await db()
      .update(calendarConnections)
      .set({ calendarId, calendarName: chosen.summary })
      .where(eq(calendarConnections.coachId, conn.coachId))
      .returning();
    syncNow();
    return c.json<CalendarStatus>(statusView(row, true));
  })
  // Removes the tokens (and asks Google to forget them). Events already in the calendar stay there.
  .delete("/", staff, async (c) => {
    const coachId = await ownCoach(c.get("user"));
    const conn = await connectionOf(coachId);
    const config = calendarConfig();
    if (conn && config) {
      try {
        await revoke(config, decrypt(conn.refreshToken, config.key));
      } catch {
        // Already revoked, unreadable or Google is down: the tokens are deleted below either way.
      }
    }
    await db().delete(calendarEvents).where(eq(calendarEvents.coachId, coachId));
    await db().delete(calendarConnections).where(eq(calendarConnections.coachId, coachId));
    return c.body(null, 204);
  });
