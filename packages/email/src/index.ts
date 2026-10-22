import { renderToStaticMarkup } from "react-dom/server";
import { consoleTransport } from "./console";
import type { EmailInput, SendResult, Transport } from "./types";

export type { EmailInput, RenderedEmail, SendResult, Transport } from "./types";
export { consoleTransport };

// T06 picks a real transport from env here; until then everything goes to the console transport.
let transport: Transport | undefined;

export function setTransport(next: Transport) {
  transport = next;
}

export async function sendEmail(input: EmailInput): Promise<SendResult> {
  const html = input.react ? renderToStaticMarkup(input.react) : `<pre>${escapeHtml(input.text)}</pre>`;
  const text = input.text ?? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  transport ??= consoleTransport();
  return transport({ to: input.to, subject: input.subject, locale: input.locale, html, text });
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
