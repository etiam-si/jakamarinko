// Message namespaces, one per feature: messages/{en,sl}/<name>.json. Add one line for yours.
export const namespaces = [
  "common",
  "consent",
] as const;

export type Namespace = (typeof namespaces)[number];
