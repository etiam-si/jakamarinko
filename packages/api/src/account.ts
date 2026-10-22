import { z } from "zod";
import { locales } from "@jakamarinko/types";
import { ConsentKind } from "./auth";
import { Booking } from "./booking";

// GET /api/account/bookings: the customer's bookings, oldest first, with how to prepare (empty for sessions).
export const AccountBooking = Booking.extend({ preparation: z.array(z.string()) });
export type AccountBooking = z.infer<typeof AccountBooking>;

// GET /api/account/profile
export const Profile = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  locale: z.enum(locales),
});
export type Profile = z.infer<typeof Profile>;

// PUT /api/account/profile. The language also changes the emails of upcoming bookings.
export const ProfileInput = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((p) => p === "" || p.length >= 6, "at least 6 characters")
    .transform((p) => p || null),
  locale: z.enum(locales),
});
export type ProfileInput = z.input<typeof ProfileInput>;

// GET /api/account/consents: every grant, newest first. A withdrawn grant keeps its row.
export const ConsentRecord = z.object({
  kind: ConsentKind,
  version: z.string(),
  grantedAt: z.iso.datetime({ offset: true }),
  withdrawnAt: z.iso.datetime({ offset: true }).nullable(),
});
export type ConsentRecord = z.infer<typeof ConsentRecord>;

// GET /api/account/export: data.json in the zip. The CSVs next to it hold the same rows.
export const AccountExport = z.object({
  exportedAt: z.iso.datetime({ offset: true }),
  profile: Profile.extend({ id: z.string(), role: z.string(), createdAt: z.iso.datetime({ offset: true }) }),
  consents: z.array(ConsentRecord),
  bookings: z.array(
    Booking.omit({ cancellable: true }).extend({
      healthAnswers: z.record(z.string(), z.union([z.boolean(), z.string()])).nullable(),
      utm: z.record(z.string(), z.string()).nullable(),
      createdAt: z.iso.datetime({ offset: true }),
      cancelledAt: z.iso.datetime({ offset: true }).nullable(),
    }),
  ),
});
export type AccountExport = z.infer<typeof AccountExport>;

// POST /api/account/delete/confirm, with the token from the email link.
export const DeleteConfirmInput = z.object({ token: z.string().min(16).max(200) });

// After an account is deleted its bookings stay for accounting with name, email and phone emptied.
// The coach shows these as "deleted user" (account.deletedUser in the web messages).
export const isDeletedCustomer = (b: { email: string; customerUserId?: string | null }) => b.email === "" && !b.customerUserId;
