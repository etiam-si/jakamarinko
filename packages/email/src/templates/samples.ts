import type { Booking, TemplateName, TemplateProps } from "./index";

// Sample props for every template, used by the tests and the preview script.
const booking: Booking = {
  id: "bk_sample",
  serviceName: "VO₂max",
  start: new Date("2026-11-03T08:00:00Z"),
  end: new Date("2026-11-03T09:30:00Z"),
  location: { name: "Laboratorij Jaka Marinko", address: "Celovška cesta 1, 1000 Ljubljana" },
  manageUrl: "https://jakamarinko.com/account/bookings/bk_sample",
};

export const samples: { [N in TemplateName]: TemplateProps<N> } = {
  magicLink: { url: "https://jakamarinko.com/api/auth/magic-link/verify?token=sample", expiresInMinutes: 15 },
  bookingConfirmation: { name: "Ana", booking, payOnSite: true },
  bookingPreparation: { name: "Ana", booking, fasted: true },
  bookingReminder: { name: "Ana", booking },
  bookingCancelled: { name: "Ana", booking, reason: "Coach is ill", refund: true, rebookUrl: "https://jakamarinko.com/booking" },
  contactReceived: {
    name: "Ana Novak",
    email: "ana@example.com",
    phone: "+386 41 000 000",
    message: "Hi, I'd like to do a lactate test before the season.\nWhich days work?",
    requestUrl: "https://jakamarinko.com/coach/requests/rq_sample",
  },
  contactAutoReply: { name: "Ana" },
  accountDelete: { url: "https://jakamarinko.com/en/account/privacy/delete?token=sample", expiresInMinutes: 60 },
};
