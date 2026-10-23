// The inbox to open after a sign-in link went out, for the big webmail providers (a mailto: link can only write
// a new email, not open the inbox). Anything else gets no button.
const providers = [
  { name: "Gmail", url: "https://mail.google.com/mail/u/0/#inbox", domains: ["gmail.com", "googlemail.com"] },
  { name: "Outlook", url: "https://outlook.live.com/mail/0/inbox", domains: ["outlook.com", "hotmail.com", "live.com", "msn.com"] },
] as const;

export function webmail(email: string) {
  const domain = email.split("@").pop()?.trim().toLowerCase() ?? "";
  return providers.find((p) => (p.domains as readonly string[]).includes(domain)) ?? null;
}
