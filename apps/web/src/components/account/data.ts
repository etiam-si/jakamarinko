import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { cache } from "react";
import { AccountBooking, ConsentRecord, Profile } from "@jakamarinko/api";
import type { Locale } from "@jakamarinko/types";
import { redirect } from "@/i18n/navigation";
import { api } from "@/lib/api";

// Server only. The signed-in customer's data, asked once per request however many blocks need it.
const cookie = async () => ({ headers: { cookie: (await headers()).get("cookie") ?? "" } });

async function ok(res: Response, what: string) {
  // The page renders alongside the layout's guard: a session that just ended goes to sign-in like the guard does.
  if (res.status === 401) redirect({ href: { pathname: "/sign-in", query: { next: "/account" } }, locale: await getLocale() });
  if (!res.ok) throw new Error(`GET /api/account/${what} failed: ${res.status}`);
  return res.json();
}

export const getMyBookings = cache(async (locale: Locale) =>
  AccountBooking.array().parse(await ok(await api.account.bookings.$get({ query: { locale } }, await cookie()), "bookings")),
);

export const getProfile = cache(async () => Profile.parse(await ok(await api.account.profile.$get(undefined, await cookie()), "profile")));

export const getConsents = cache(async () =>
  ConsentRecord.array().parse(await ok(await api.account.consents.$get(undefined, await cookie()), "consents")),
);
