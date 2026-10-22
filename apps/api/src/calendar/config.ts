import { z } from "zod";
import { bookingConfig } from "../booking/config";

const Env = z.object({
  // Same OAuth client as Google sign-in (T03), with the calendar scopes added in Google Cloud.
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  // 32 random bytes, base64: openssl rand -base64 32. Encrypts the stored tokens.
  CALENDAR_TOKEN_KEY: z
    .string()
    .refine((k) => Buffer.from(k, "base64").length === 32, "CALENDAR_TOKEN_KEY must be 32 bytes, base64")
    .optional(),
  // Tests only: one origin standing in for accounts.google.com, oauth2.googleapis.com and www.googleapis.com.
  CALENDAR_GOOGLE_BASE: z.url().optional(),
});

let warned = false;

// Read on every call, so tests can change the environment. Null when a key is missing or bad: the feature is off,
// and booking never fails because of it.
export function calendarConfig(source: NodeJS.ProcessEnv = process.env) {
  const parsed = Env.safeParse(Object.fromEntries(Object.entries(source).filter(([, v]) => v !== "")));
  if (!parsed.success) {
    if (!warned) console.warn(`calendar sync off: ${parsed.error.issues.map((i) => i.message).join("; ")}`);
    warned = true;
    return null;
  }
  const e = parsed.data;
  if (!e.GOOGLE_CLIENT_ID || !e.GOOGLE_CLIENT_SECRET || !e.CALENDAR_TOKEN_KEY) return null;
  const base = e.CALENDAR_GOOGLE_BASE?.replace(/\/$/, "");
  const { siteUrl, horizonDays } = bookingConfig(source);
  return {
    clientId: e.GOOGLE_CLIENT_ID,
    clientSecret: e.GOOGLE_CLIENT_SECRET,
    key: Buffer.from(e.CALENDAR_TOKEN_KEY, "base64"),
    siteUrl,
    redirectUri: `${siteUrl}/api/calendar/google/callback`,
    authUrl: `${base ?? "https://accounts.google.com"}/o/oauth2/v2/auth`,
    oauthUrl: base ?? "https://oauth2.googleapis.com",
    apiUrl: `${base ?? "https://www.googleapis.com"}/calendar/v3`,
    // Busy times are read as far ahead as anyone can book.
    horizonDays,
  };
}

export type CalendarConfig = NonNullable<ReturnType<typeof calendarConfig>>;
