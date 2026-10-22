import { z } from "zod";
import { locales } from "@jakamarinko/types";

export const RequestTopic = z.enum(["coaching", "lab_test", "other"]);
export type RequestTopic = z.infer<typeof RequestTopic>;
export const RequestStatus = z.enum(["new", "answered", "done"]);
export type RequestStatus = z.infer<typeof RequestStatus>;

// POST /api/requests, from the contact form. `website` is the honeypot: people leave it empty.
export const CreateRequestInput = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.email().max(320),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((p) => p === "" || p.length >= 6, "too short")
    .optional(),
  topic: RequestTopic,
  message: z.string().trim().min(1).max(5000),
  locale: z.enum(locales),
  consent: z.literal(true),
  website: z.string().max(500).optional(),
});
export type CreateRequestInput = z.infer<typeof CreateRequestInput>;

// GET /api/requests?status= (coach). Newest first.
export const RequestsQuery = z.object({ status: RequestStatus.optional() });

export const ContactRequest = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  topic: RequestTopic,
  message: z.string(),
  locale: z.enum(locales),
  status: RequestStatus,
  createdAt: z.iso.datetime({ offset: true }),
});
export type ContactRequest = z.infer<typeof ContactRequest>;

// PATCH /api/requests/:id (coach)
export const UpdateRequestInput = z.object({ status: RequestStatus });
