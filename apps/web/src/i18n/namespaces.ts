// Message namespaces, one per feature: messages/{en,sl}/<name>.json. Add one line for yours.
export const namespaces = [
  "common",
  "home",
  "about",
  "coaching",
  "lab",
  "packages",
  "contact",
  "footer",
] as const;

export type Namespace = (typeof namespaces)[number];
