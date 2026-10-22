export const locales = ["en", "sl"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

// The disciplines Jaka coaches (docs/content/jaka-marinko.md, "Discipline").
export const sports = [
  "road_running",
  "trail_running",
  "road_cycling",
  "mountain_biking",
  "cross_country_skiing",
  "ski_touring",
] as const;
export type Sport = (typeof sports)[number];

// owner ⊇ head_coach ⊇ coach (docs/plan/tasks/T03-auth.md).
export const roles = ["customer", "athlete", "coach", "head_coach", "owner"] as const;
export type Role = (typeof roles)[number];
