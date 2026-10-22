import nodemailer from "nodemailer";
import type { Transport } from "./types";

export type SmtpConfig = { host: string; port: number; secure: boolean; user?: string; pass?: string; from: string };

// Any provider that speaks SMTP. Creating it doesn't connect; each send does.
export function smtpTransport(config: SmtpConfig): Transport {
  const mailer = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.pass } : undefined,
  });
  return async (email) => {
    try {
      const info = await mailer.sendMail({
        from: config.from,
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
        attachments: email.attachments?.map((a) => ({ filename: a.filename, content: a.content, contentType: a.contentType })),
      });
      return { ok: true, id: info.messageId };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  };
}
