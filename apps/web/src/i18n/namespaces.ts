// Message namespaces, one per feature: messages/{en,sl}/<name>.json. Add one line for yours.
export const namespaces = [
  "common",
  "legal",
  "home",
  "about",
  "coaching",
  "lab",
  "packages",
  "contact",
  "footer",
  "brand",
  "auth",
  "consent",
  "app",
  "site",
  "requests",
  "coach-booking",
  "booking",
  "account",
  "calendar",
] as const;

export type Namespace = (typeof namespaces)[number];
