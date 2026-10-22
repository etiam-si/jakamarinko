import type { Service, ServiceId } from "@jakamarinko/api";
import { labTests, sessions, type LabTest, type Locale, type Session } from "@jakamarinko/types";

// Everything bookable into a slot. Names and texts live here; prices and durations also in service_types.
export const bookable: (LabTest | Session)[] = [...labTests, ...sessions];

export function catalogItem(id: string) {
  const item = bookable.find((s) => s.id === id);
  if (!item) throw new Error(`service ${id} is not in the catalog`);
  return item;
}

// The fat and carbohydrate test needs an empty stomach, also inside a package.
export function needsFasting(id: string) {
  const item = catalogItem(id);
  return item.kind === "lab_test" && (item.id === "fat-carb" || !!item.contains?.includes("fat-carb"));
}

export function serviceView(row: { catalogId: string; durationMin: number; priceCents: number }, locale: Locale): Service {
  const item = catalogItem(row.catalogId);
  return {
    id: item.id,
    kind: item.kind,
    durationMin: row.durationMin,
    priceCents: row.priceCents,
    name: item.name[locale],
    description: item.description[locale],
    preparation: item.kind === "lab_test" ? item.preparation[locale] : [],
  };
}

export const serviceName = (id: ServiceId | string, locale: Locale) => catalogItem(id).name[locale];
