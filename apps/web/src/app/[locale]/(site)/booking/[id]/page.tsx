import type { Metadata } from "next";
import { Check } from "lucide-react";
import { headers } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Booking } from "@jakamarinko/api";
import { labTests, locales } from "@jakamarinko/types";
import { SectionHeading } from "@/components/brand/section-heading";
import { AddToCalendar } from "@/components/booking/add-to-calendar";
import { CancelBooking } from "@/components/booking/cancel-booking";
import { CreateAccount } from "@/components/booking/create-account";
import { PaidNote } from "@/components/booking/payment/paid-note";
import { PaidTracker } from "@/components/booking/payment/paid-tracker";
import { PendingPayment } from "@/components/booking/payment/pending-payment";
import { formatWhen } from "@/components/booking/time";
import { Unavailable } from "@/components/booking/unavailable";
import { Section } from "@/components/site/section";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { getSession } from "@/lib/session";

type Props = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ token?: string; confirmed?: string; paid?: string }>;
};

// The link in every booking email. Private to whoever holds the token, so never indexed.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "booking.manage" });
  return { title: t("meta"), robots: { index: false, follow: false } };
}

// The signed-in owner needs no token: their cookie goes along.
async function load(id: string, token: string | undefined) {
  try {
    const cookie = (await headers()).get("cookie") ?? "";
    const res = await api.booking[":id"].$get({ param: { id }, query: { token } }, { headers: { cookie } });
    if (res.ok) return Booking.parse(await res.json());
    return res.status >= 500 ? "unavailable" : "notFound";
  } catch {
    return "unavailable";
  }
}

export default async function ManageBookingPage({ params, searchParams }: Props) {
  const { locale: raw, id } = await params;
  setRequestLocale(raw);
  const locale = locales.find((l) => l === raw) ?? "en";
  const { token, confirmed, paid } = await searchParams;
  const t = await getTranslations("booking");
  const [booking, session] = await Promise.all([load(id, typeof token === "string" ? token : undefined), getSession().catch(() => null)]);

  if (typeof booking === "string") {
    return (
      <main>
        <Section className="flex max-w-2xl flex-col gap-8 pt-10 md:pt-16">
          <SectionHeading as="h1" title={t("manage.heading")} />
          {booking === "notFound" ? <p>{t("manage.notFound")}</p> : <Unavailable />}
        </Section>
      </main>
    );
  }

  const active = booking.status === "confirmed" || booking.status === "pending_payment";
  const justBooked = confirmed === "1" && booking.status === "confirmed";
  const preparation = labTests.find((l) => l.id === booking.service)?.preparation[locale] ?? [];
  const where = `${booking.location.name}, ${booking.location.address}`;
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const map = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.location.address)}`;
  const event = {
    id: booking.id,
    start: booking.start,
    end: booking.end,
    title: `${booking.serviceName}, Jaka Marinko`,
    location: where,
    url: `${origin}/${locale}/booking/${booking.id}${token ? `?token=${encodeURIComponent(token)}` : ""}`,
  };

  return (
    <main>
      <Section className="flex max-w-2xl flex-col gap-8 pt-8 pb-14 md:pt-14 md:pb-20">
        <div className="flex flex-col gap-4">
          {justBooked && (
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md duration-500 animate-in fade-in-0 zoom-in-75 motion-reduce:animate-none">
              <Check aria-hidden className="size-7" strokeWidth={2.5} />
            </span>
          )}
          <SectionHeading as="h1" title={justBooked ? t("confirmed.heading") : t("manage.heading")} />
          {justBooked && <p className="text-lg text-pretty text-muted-foreground">{t("confirmed.text", { email: booking.email })}</p>}
        </div>

        <dl className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border bg-card shadow-sm">
          {[
            [t("review.service"), <span key="s" data-testid="booking-service">{booking.serviceName}</span>],
            [t("review.when"), <span key="w" data-testid="booking-when">{formatWhen(booking.start, locale)}</span>],
            [
              t("manage.where"),
              <span key="l" className="flex flex-col">
                <span>{booking.location.name}</span>
                <span>{booking.location.address}</span>
                <a
                  href={map}
                  target="_blank"
                  rel="noopener"
                  className="-my-2 inline-flex min-h-11 items-center self-start text-sm text-primary underline-offset-4 hover:underline"
                >
                  {t("manage.map")}
                </a>
              </span>,
            ],
            [t("review.name"), booking.name],
            [t("manage.statusLabel"), <span key="st" data-testid="booking-status">{t(`manage.status.${booking.status}`)}</span>],
          ].map(([label, value], i) => (
            <div key={i} className="grid grid-cols-[5.5rem_1fr] items-baseline gap-3 px-4 py-3 sm:grid-cols-[7rem_1fr]">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="font-medium break-words">{value}</dd>
            </div>
          ))}
        </dl>

        {booking.status === "confirmed" && booking.paidVia === "none" && (
          <p className="rounded-lg bg-muted px-4 py-3 text-sm">{t("confirmed.payOnSite")}</p>
        )}
        {active && booking.paidVia === "stripe" && <PaidNote />}
        {active && booking.paidVia === "stripe" && paid === "1" && <PaidTracker id={booking.id} service={booking.service} />}
        {booking.status === "pending_payment" && <PendingPayment id={booking.id} token={token} returned={paid === "1"} />}
        {active && <AddToCalendar event={event} />}

        {active && preparation.length > 0 && (
          <section aria-labelledby="preparation" className="flex flex-col gap-3">
            <h2 id="preparation" className="font-semibold">
              {t("confirmed.preparation")}
            </h2>
            <ul className="flex flex-col gap-2.5">
              {preparation.map((p) => (
                <li key={p} className="flex items-start gap-3 text-pretty">
                  <Check aria-hidden className="mt-1 size-4 shrink-0 text-primary" />
                  {p}
                </li>
              ))}
            </ul>
          </section>
        )}

        {!session && active && <CreateAccount email={booking.email} />}

        {active && <CancelBooking id={booking.id} token={token} cancellable={booking.cancellable} />}
        {booking.status === "cancelled" && (
          <div className="flex flex-col gap-4">
            <p role="status">{t("manage.cancelled")}</p>
            <Link href={{ pathname: "/booking", query: { service: booking.service } }} className={buttonVariants({ size: "lg", className: "self-start" })}>
              {t("manage.bookAgain")}
            </Link>
          </div>
        )}
      </Section>
    </main>
  );
}
