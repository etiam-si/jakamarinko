import { z } from "zod";

const LocalDate = z.iso.date();

// GET /api/conversions/report?from&to (owner): Ljubljana dates, both included, by the day the booking was made.
export const ConversionReportQuery = z
  .object({ from: LocalDate, to: LocalDate })
  .refine((q) => q.to >= q.from && Date.parse(q.to) - Date.parse(q.from) <= 366 * 86_400_000, {
    path: ["to"],
    message: "from..to must be 0 to 366 days",
  });
export type ConversionReportQuery = z.infer<typeof ConversionReportQuery>;

// Bookings and revenue per ad source and campaign. null: the booking came without that utm parameter (or without
// marketing consent, when the source isn't kept).
export const ConversionReportRow = z.object({
  source: z.string().nullable(),
  campaign: z.string().nullable(),
  bookings: z.number(),
  revenueCents: z.number(),
});
export type ConversionReportRow = z.infer<typeof ConversionReportRow>;

export const ConversionReport = z.object({
  rows: z.array(ConversionReportRow),
  total: z.object({ bookings: z.number(), revenueCents: z.number() }),
});
export type ConversionReport = z.infer<typeof ConversionReport>;
