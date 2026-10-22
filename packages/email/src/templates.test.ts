import { locales } from "@jakamarinko/types";
import { describe, expect, test } from "vitest";
import { renderTemplate, type TemplateName } from "./index";
import en from "./messages/en.json";
import sl from "./messages/sl.json";
import { templates } from "./templates";
import { samples } from "./templates/samples";

const names = Object.keys(templates) as TemplateName[];

describe.each(names)("%s", (name) => {
  test.each(locales)("renders in %s with nothing missing", async (locale) => {
    const email = await renderTemplate(name, locale, samples[name] as never);
    for (const out of [email.subject, email.html, email.text]) {
      expect(out).not.toMatch(/undefined|null|NaN|\{\w+\}/);
    }
    expect(email.html).toContain(`lang="${locale}"`);
  });

  test("subject differs between the languages", async () => {
    const [a, b] = await Promise.all(locales.map((l) => renderTemplate(name, l, samples[name] as never)));
    expect(a!.subject).not.toBe(b!.subject);
  });
});

test("Slovenian has every English key and no empty text", () => {
  const keys = (o: object, prefix = ""): string[] =>
    Object.entries(o).flatMap(([k, v]) => (typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
  expect(keys(sl).sort()).toEqual(keys(en).sort());
  for (const value of JSON.stringify(sl).match(/"[^"]*"/g)!) expect(value).not.toBe('""');
});

test("times are shown in Ljubljana time", async () => {
  // 08:00 UTC in November is 09:00 in Ljubljana.
  const { html } = await renderTemplate("bookingReminder", "sl", samples.bookingReminder);
  expect(html).toContain("09:00");
  const { subject } = await renderTemplate("bookingReminder", "en", samples.bookingReminder);
  expect(subject).toBe("Tomorrow: VO₂max at 09:00");
});

test("the confirmation carries the calendar invite", async () => {
  const { attachments } = await renderTemplate("bookingConfirmation", "en", samples.bookingConfirmation);
  expect(attachments).toEqual([expect.objectContaining({ filename: "booking.ics", contentType: expect.stringContaining("text/calendar") })]);
});

test("preparation asks for fasting only for the fat and carbohydrate test", async () => {
  const fasted = await renderTemplate("bookingPreparation", "en", { ...samples.bookingPreparation, fasted: true });
  const fed = await renderTemplate("bookingPreparation", "en", { ...samples.bookingPreparation, fasted: false });
  expect(fasted.text).toContain("Come fasted");
  expect(fed.text).not.toContain("Come fasted");
  expect(fed.text).toContain("light meal");
});

test("transactional emails have no unsubscribe link", async () => {
  for (const name of names) {
    const { html } = await renderTemplate(name, "en", samples[name] as never);
    expect(html).not.toContain(en.layout.unsubscribe);
  }
});
