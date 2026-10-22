import type { ReactElement } from "react";
import type { Locale } from "@jakamarinko/types";

export type Attachment = { filename: string; contentType: string; content: string };

// A raw email, for the rare case without a template.
export type EmailInput = {
  to: string;
  subject: string;
  locale: Locale;
} & ({ react: ReactElement; text?: string } | { react?: undefined; text: string });

// What a template returns for one locale.
export type TemplateOutput = { subject: string; body: ReactElement; attachments?: Attachment[] };
export type Template<P> = (props: P, locale: Locale) => TemplateOutput;

// What a transport gets: the body already rendered.
export type RenderedEmail = {
  to: string;
  subject: string;
  locale: Locale;
  html: string;
  text: string;
  attachments?: Attachment[];
};

// Sending never throws; a failure comes back as { ok: false }.
export type SendResult = { ok: true; id: string } | { ok: false; error: string };

export type Transport = (email: RenderedEmail) => Promise<SendResult>;
