import { eq } from "drizzle-orm";
import { db } from "@jakamarinko/db";
import { calendarConnections } from "@jakamarinko/db/schema";
import type { CalendarConfig } from "./config";
import { decrypt, encrypt } from "./crypto";
import { GoogleError, refreshAccess } from "./google";

export type Connection = typeof calendarConnections.$inferSelect;

export async function connectionOf(coachId: string) {
  const [row] = await db().select().from(calendarConnections).where(eq(calendarConnections.coachId, coachId));
  return row;
}

// Google no longer takes our tokens: stop syncing until the coach reconnects. Busy times are dropped, so a stale
// copy never blocks slots; booking goes on without sync.
async function markRevoked(coachId: string) {
  await db()
    .update(calendarConnections)
    .set({ status: "needs_reconnect", accessToken: null, accessTokenExpiresAt: null, busy: [], busyFetchedAt: null })
    .where(eq(calendarConnections.coachId, coachId));
}

async function freshToken(config: CalendarConfig, conn: Connection, now: Date) {
  let refreshToken: string;
  try {
    refreshToken = decrypt(conn.refreshToken, config.key);
  } catch {
    // CALENDAR_TOKEN_KEY changed: the stored token is unreadable, so the coach has to connect again.
    await markRevoked(conn.coachId);
    throw new GoogleError(401, true);
  }
  const tokens = await refreshAccess(config, refreshToken).catch(async (err: unknown) => {
    if (err instanceof GoogleError && err.revoked) await markRevoked(conn.coachId);
    throw err;
  });
  await db()
    .update(calendarConnections)
    .set({ accessToken: encrypt(tokens.access_token, config.key), accessTokenExpiresAt: new Date(now.getTime() + tokens.expires_in * 1000) })
    .where(eq(calendarConnections.coachId, conn.coachId));
  return tokens.access_token;
}

function storedToken(config: CalendarConfig, conn: Connection, now: Date) {
  if (!conn.accessToken || !conn.accessTokenExpiresAt || conn.accessTokenExpiresAt.getTime() - 60_000 <= now.getTime()) return;
  try {
    return decrypt(conn.accessToken, config.key);
  } catch {
    return undefined;
  }
}

// Runs a Google call with a valid access token. A refused access token is refreshed and the call tried once more;
// a refused refresh token marks the connection needs_reconnect. Throws GoogleError on failure.
export async function withGoogle<T>(config: CalendarConfig, conn: Connection, run: (token: string) => Promise<T>, now = new Date()) {
  const stored = storedToken(config, conn, now);
  if (stored) {
    try {
      return await run(stored);
    } catch (err) {
      if (!(err instanceof GoogleError && err.status === 401)) throw err;
    }
  }
  const token = await freshToken(config, conn, now);
  try {
    return await run(token);
  } catch (err) {
    if (err instanceof GoogleError && err.status === 401) await markRevoked(conn.coachId);
    throw err;
  }
}
