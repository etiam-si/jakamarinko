import { z } from "zod";

// Conversion events, sent by track() in web. Server-side copies (Meta Conversions API) come with T14.
export const TrackEvent = z.enum(["booking_started", "booking_paid", "package_started", "contact_sent", "lead_signup"]);
export type TrackEvent = z.infer<typeof TrackEvent>;

// Flat values only, and never health data or anything that identifies a person: these go to third parties.
export const EventProps = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));
export type EventProps = z.infer<typeof EventProps>;

// Where a visitor came from, last touch (web keeps it 30 days). T11 stores it on the booking.
const param = z.string().max(500).optional();
export const Attribution = z.object({
  utm_source: param,
  utm_medium: param,
  utm_campaign: param,
  utm_term: param,
  utm_content: param,
  fbclid: param,
  gclid: param,
});
export type Attribution = z.infer<typeof Attribution>;

// Which tags the site may load. The ids are read by the api at runtime, because the web image is built without env.
export const TagsConfig = z.object({
  umami: z.object({ src: z.url(), websiteId: z.string() }).nullable(),
  metaPixelId: z.string().nullable(),
  googleTagId: z.string().nullable(),
});
export type TagsConfig = z.infer<typeof TagsConfig>;
