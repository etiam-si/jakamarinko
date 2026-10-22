import { createElement as h } from "react";
import type { Locale } from "@jakamarinko/types";

// Plain until T06 brings the shared email layout.
const copy = {
  en: {
    subject: "Your sign-in link",
    intro: (email: string) => `Use this link to sign in to jakamarinko.com as ${email}:`,
    button: "Sign in",
    note: "The link works once and expires in 15 minutes. If you didn't ask for it, you can ignore this email.",
  },
  sl: {
    subject: "Tvoja povezava za prijavo",
    intro: (email: string) => `S to povezavo se prijaviš na jakamarinko.com kot ${email}:`,
    button: "Prijava",
    note: "Povezava deluje enkrat in poteče v 15 minutah. Če je ne pričakuješ, to sporočilo preprosto prezri.",
  },
} satisfies Record<Locale, unknown>;

export function magicLinkEmail(locale: Locale, email: string, url: string) {
  const t = copy[locale];
  return {
    subject: t.subject,
    text: `${t.intro(email)}\n\n${url}\n\n${t.note}`,
    // createElement rather than JSX, so the api doesn't need a JSX setting to compile this package.
    react: h("div", null, h("p", null, t.intro(email)), h("p", null, h("a", { href: url }, t.button)), h("p", null, t.note)),
  };
}
