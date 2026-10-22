import type { AddressInfo } from "node:net";
import { simpleParser } from "mailparser";
import { SMTPServer } from "smtp-server";
import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { sendEmail, setTransport, smtpTransport, transportFromEnv } from "./index";
import { samples } from "./templates/samples";

// A real SMTP server in the test process, so the whole wire path runs in CI.
const received: string[] = [];
const server = new SMTPServer({
  authOptional: true,
  disabledCommands: ["STARTTLS"],
  onRcptTo(address, _session, done) {
    done(address.address.startsWith("bounce@") ? new Error("mailbox unavailable") : undefined);
  },
  onData(stream, _session, done) {
    let raw = "";
    stream.on("data", (chunk) => (raw += chunk));
    stream.on("end", () => {
      received.push(raw);
      done();
    });
  },
});
let port = 0;

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = (server.server.address() as AddressInfo).port;
});
afterAll(() => new Promise<void>((resolve) => server.close(resolve)));

test("a booking confirmation arrives with the subject in each language and the invite", async () => {
  setTransport(smtpTransport({ host: "127.0.0.1", port, secure: false, from: "Jaka Marinko <noreply@jakamarinko.com>" }));

  for (const locale of ["en", "sl"] as const) {
    const result = await sendEmail({ to: "ana@example.com", locale, template: "bookingConfirmation", props: samples.bookingConfirmation });
    expect(result.ok).toBe(true);
  }

  const [en, sl] = await Promise.all(received.map((raw) => simpleParser(raw)));
  expect(en!.subject).toBe("Booking confirmed: VO₂max, Tuesday 3 November");
  expect(sl!.subject).toBe("Rezervacija potrjena: VO₂max, torek, 3. november");
  expect(sl!.to).toMatchObject({ text: "ana@example.com" });
  expect(sl!.attachments.map((a) => a.filename)).toEqual(["booking.ics"]);
});

test("a send failure comes back as a result and logs no recipient", async () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  setTransport(smtpTransport({ host: "127.0.0.1", port, secure: false, from: "x@jakamarinko.com" }));

  const result = await sendEmail({ to: "bounce@example.com", locale: "en", template: "contactAutoReply", props: { name: "Ana" } });

  expect(result.ok).toBe(false);
  expect(warn).toHaveBeenCalledOnce();
  expect(warn.mock.calls[0]![0]).toMatch(/^email contactAutoReply \[en\] not sent/);
  expect(warn.mock.calls[0]![0]).not.toContain("bounce@example.com");
  warn.mockRestore();
});

test("smtp without a host falls back to the console with a warning", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  expect(transportFromEnv({ EMAIL_TRANSPORT: "smtp", EMAIL_FROM: "x@jakamarinko.com" })).toBeTypeOf("function");
  expect(warn).toHaveBeenCalledWith(expect.stringContaining("SMTP_HOST"));
  warn.mockRestore();
});

test("production on the console transport warns at start", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  transportFromEnv({ NODE_ENV: "production" });
  expect(warn).toHaveBeenCalledWith(expect.stringContaining("no email reaches anyone"));
  warn.mockRestore();
});
