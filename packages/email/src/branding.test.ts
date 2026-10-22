import { locales } from "@jakamarinko/types";
import { describe, expect, test } from "vitest";
import { renderTemplate, type TemplateName } from "./index";
import en from "./messages/en.json";
import sl from "./messages/sl.json";
import { site, theme } from "./theme";
import { samples } from "./templates/samples";

// US-011: every customer email carries the brand header, one primary button and the footer, in a form email clients
// draw the same way (tables, inline styles), and keeps its plain-text part.
const branded: TemplateName[] = ["magicLink", "bookingConfirmation", "bookingReminder", "bookingRescheduled", "bookingCancelled"];
const messages = { en, sl };
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

describe.each(branded)("%s", (name) => {
  test.each(locales)("%s: logo, primary button, footer and a plain-text part", async (locale) => {
    const { html, text } = await renderTemplate(name, locale, samples[name] as never);

    // The logo, with alt text for clients that block images.
    expect(html).toMatch(new RegExp(`<img[^>]*alt="${escape(site.name)}[^"]+"[^>]*src="${escape(site.logo.src)}"`));
    // The button is a link with its colour inline, and the layout is tables.
    expect(html).toMatch(new RegExp(`<a[^>]*href="https://[^"]+"[^>]*style="[^"]*background-color:${theme.accent}`));
    expect(html).toContain('role="presentation"');
    // The footer: contact line and the brand.
    expect(html).toContain(site.phone);
    expect(html).toContain(messages[locale].layout.tagline);
    // The heading is the email's own preview line, in its language.
    expect(html).toMatch(new RegExp(`<h1[^>]*>${escape(messages[locale][name].preview)}</h1>`));

    expect(text.length).toBeGreaterThan(100);
    // The plain-text part starts at the heading (the header and stripe are left out of it).
    expect(text.toLowerCase().trimStart()).toMatch(new RegExp(`^${escape(messages[locale][name].preview.toLowerCase())}`));
    expect(text).not.toMatch(/<[a-z]/i);
  });
});

test("the sign-in email's HTML", async () => {
  const { html } = await renderTemplate("magicLink", "en", samples.magicLink);
  expect(html).toMatchSnapshot();
});
