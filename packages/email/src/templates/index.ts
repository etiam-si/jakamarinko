import type { Template } from "../types";
import { bookingCancelled } from "./booking-cancelled";
import { bookingConfirmation } from "./booking-confirmation";
import { bookingPreparation } from "./booking-preparation";
import { bookingReminder } from "./booking-reminder";
import { contactAutoReply, contactReceived } from "./contact";
import { magicLink } from "./magic-link";

export type { Booking } from "./booking";

export const templates = {
  magicLink,
  bookingConfirmation,
  bookingPreparation,
  bookingReminder,
  bookingCancelled,
  contactReceived,
  contactAutoReply,
};

export type TemplateName = keyof typeof templates;
export type TemplateProps<N extends TemplateName> = (typeof templates)[N] extends Template<infer P> ? P : never;
