import { z } from "zod";
import { consoleTransport } from "./console";
import { smtpTransport } from "./smtp";
import type { Transport } from "./types";

const smtpEnv = z.object({
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  // true for port 465 (TLS from the start); 587 and 1025 upgrade with STARTTLS or stay plain.
  SMTP_SECURE: z.enum(["true", "false"]).default("false"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().min(1),
});

const transportName = z.enum(["console", "smtp"]).default("console");

// Picks the transport from EMAIL_TRANSPORT. A bad config falls back to the console with a warning, never a crash.
export function transportFromEnv(env: NodeJS.ProcessEnv = process.env): Transport {
  const name = transportName.safeParse(env.EMAIL_TRANSPORT || undefined);
  if (!name.success) console.warn(`email: unknown EMAIL_TRANSPORT "${env.EMAIL_TRANSPORT}", using console`);

  if (name.data === "smtp") {
    const smtp = smtpEnv.safeParse(env);
    if (smtp.success) {
      const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, EMAIL_FROM } = smtp.data;
      return smtpTransport({ host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_SECURE === "true", user: SMTP_USER, pass: SMTP_PASS, from: EMAIL_FROM });
    }
    const missing = smtp.error.issues.map((i) => i.path.join(".")).join(", ");
    console.warn(`email: EMAIL_TRANSPORT=smtp but ${missing} is missing or invalid, using console`);
  }

  if (env.NODE_ENV === "production") console.warn("email: production uses the console transport, so no email reaches anyone");
  return consoleTransport();
}
