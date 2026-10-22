import { createHash } from "node:crypto";
import { z } from "zod";
import { metaEventNames, type TrackEvent } from "@jakamarinko/api";
import type { ConversionClient } from "@jakamarinko/db/schema";

const graphUrl = "https://graph.facebook.com/v23.0";

// All optional: without the pixel id and the token, server events are off. META_TEST_EVENT_CODE sends them to
// Events Manager's "Test events" tab instead of the real statistics.
const MetaEnv = z.object({
  META_PIXEL_ID: z.string().min(1).optional(),
  META_CAPI_TOKEN: z.string().min(1).optional(),
  META_TEST_EVENT_CODE: z.string().min(1).optional(),
});

export type MetaConfig = { pixelId: string; token: string; testEventCode?: string };

export function metaConfig(source: Record<string, string | undefined> = process.env): MetaConfig | null {
  const e = MetaEnv.parse(Object.fromEntries(Object.entries(source).filter(([, v]) => v !== "")));
  if (!e.META_PIXEL_ID || !e.META_CAPI_TOKEN) return null;
  return { pixelId: e.META_PIXEL_ID, token: e.META_CAPI_TOKEN, testEventCode: e.META_TEST_EVENT_CODE };
}

export type Conversion = {
  name: TrackEvent;
  // The pixel event's id, so Meta counts the browser's and the server's copy once.
  eventId: string;
  email: string;
  // The visitor's cookie choice when they acted. Without marketing consent nothing is sent.
  marketingConsent: boolean;
  value?: number;
  currency?: string;
  client?: ConversionClient | null;
  time?: Date;
};

// sent: Meta accepted it. skipped: no consent. off: no keys. failed: refused or no answer.
export type Outcome = "sent" | "skipped" | "off" | "failed";

const sha256 = (value: string) => createHash("sha256").update(value.trim().toLowerCase()).digest("hex");

// Meta's Conversions API: one event, with the email hashed as Meta requires. Never throws: a conversion that
// can't be reported must not break a booking or a contact form. Logs only the event name and the HTTP status.
export async function reportConversion(conversion: Conversion, config = metaConfig()): Promise<Outcome> {
  if (!conversion.marketingConsent) return "skipped";
  if (!config) return "off";
  const { client } = conversion;
  const event = {
    event_name: metaEventNames[conversion.name],
    event_time: Math.floor((conversion.time ?? new Date()).getTime() / 1000),
    event_id: conversion.eventId,
    action_source: "website",
    event_source_url: client?.sourceUrl,
    user_data: {
      em: [sha256(conversion.email)],
      client_ip_address: client?.ip,
      client_user_agent: client?.userAgent,
      fbp: client?.fbp,
      fbc: client?.fbc,
    },
    custom_data: conversion.value === undefined ? undefined : { value: conversion.value, currency: conversion.currency ?? "EUR" },
  };
  try {
    const res = await fetch(`${graphUrl}/${encodeURIComponent(config.pixelId)}/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: [event], test_event_code: config.testEventCode, access_token: config.token }),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) return "sent";
    console.warn(`conversions: Meta refused ${conversion.name} (HTTP ${res.status})`);
  } catch {
    console.warn(`conversions: Meta did not answer for ${conversion.name}`);
  }
  return "failed";
}
