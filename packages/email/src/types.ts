import type { ReactElement } from "react";
import type { Locale } from "@jakamarinko/types";

export type EmailInput = {
  to: string;
  subject: string;
  locale: Locale;
} & ({ react: ReactElement; text?: string } | { react?: undefined; text: string });

// What a transport gets: the body already rendered.
export type RenderedEmail = { to: string; subject: string; locale: Locale; html: string; text: string };

// Sending never throws; a failure comes back as { ok: false }.
export type SendResult = { ok: true; id: string } | { ok: false; error: string };

export type Transport = (email: RenderedEmail) => Promise<SendResult>;
