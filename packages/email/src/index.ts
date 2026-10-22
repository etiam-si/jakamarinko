import { render } from "@react-email/components";
import type { Locale } from "@jakamarinko/types";
import { renderToStaticMarkup } from "react-dom/server";
import { consoleTransport } from "./console";
import { transportFromEnv } from "./env";
import { smtpTransport } from "./smtp";
import { type TemplateName, type TemplateProps, templates } from "./templates";
import type { EmailInput, RenderedEmail, SendResult, Transport } from "./types";

export type { Attachment, EmailInput, RenderedEmail, SendResult, Transport } from "./types";
export type { Booking, TemplateName, TemplateProps } from "./templates";
export { consoleTransport, smtpTransport, templates, transportFromEnv };

// Chosen once at start, so a production misconfig shows in the log right away.
let transport: Transport = transportFromEnv();

export function setTransport(next: Transport) {
  transport = next;
}

export type TemplateEmail = { [N in TemplateName]: { to: string; locale: Locale; template: N; props: TemplateProps<N> } }[TemplateName];

// Subject, html, plain text and attachments of one template in one language.
export async function renderTemplate<N extends TemplateName>(template: N, locale: Locale, props: TemplateProps<N>) {
  const { subject, body, attachments } = templates[template](props as never, locale);
  const [html, text] = await Promise.all([render(body), render(body, { plainText: true })]);
  return { subject, html, text, attachments };
}

// Never throws. A failure is logged by template name only: recipient and props stay out of the log.
export async function sendEmail(input: TemplateEmail | EmailInput): Promise<SendResult> {
  const label = "template" in input ? input.template : "raw";
  let result: SendResult;
  try {
    const email: RenderedEmail =
      "template" in input
        ? { to: input.to, locale: input.locale, ...(await renderTemplate(input.template, input.locale, input.props as never)) }
        : renderRaw(input);
    result = await transport(email);
  } catch (err) {
    result = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
  if (!result.ok) console.warn(`email ${label} [${input.locale}] not sent: ${result.error}`);
  return result;
}

function renderRaw(input: EmailInput): RenderedEmail {
  const html = input.react ? renderToStaticMarkup(input.react) : `<pre>${escapeHtml(input.text)}</pre>`;
  const text = input.text ?? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return { to: input.to, subject: input.subject, locale: input.locale, html, text };
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
