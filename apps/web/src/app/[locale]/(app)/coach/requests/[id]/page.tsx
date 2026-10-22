import { ArrowLeft, Mail } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/app-shell/page-header";
import { RequestStatusSelect } from "@/components/contact/request-status";
import { StatusBadge } from "@/components/contact/status-badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getRequest } from "../fetch";

type Props = { params: Promise<{ id: string }> };

// One request: who sent it, the message, a reply by email and the status.
export default async function RequestPage({ params }: Props) {
  const request = await getRequest((await params).id);
  const t = await getTranslations("requests.inbox");
  const form = await getTranslations("requests.form");
  // The reply goes out in the sender's language, so its subject does too.
  const theirs = await getTranslations({ locale: request.locale, namespace: "requests.inbox" });
  const format = await getFormatter();
  const received = format.dateTime(new Date(request.createdAt), { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Ljubljana" });
  const mailto = `mailto:${request.email}?subject=${encodeURIComponent(theirs("replySubject"))}`;

  const details: [string, React.ReactNode][] = [
    [t("topic"), form(`topics.${request.topic}`)],
    [t("email"), request.email],
    ...(request.phone ? [[t("phone"), <a href={`tel:${request.phone}`}>{request.phone}</a>] as [string, React.ReactNode]] : []),
    [t("language"), t(`languages.${request.locale}`)],
  ];

  return (
    <>
      <Link href="/coach/requests" className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft aria-hidden className="size-4" />
        {t("back")}
      </Link>
      <div className="flex flex-col gap-3">
        <PageHeader
          title={request.name}
          lead={t("received", { date: received })}
          action={
            <Button asChild>
              <a href={mailto}>
                <Mail aria-hidden />
                {t("reply")}
              </a>
            </Button>
          }
        />
        <StatusBadge status={request.status} label={t(`statuses.${request.status}`)} />
      </div>
      <dl className="grid max-w-2xl gap-x-6 gap-y-2 rounded-xl border bg-card p-5 shadow-sm sm:grid-cols-[auto_1fr]">
        {details.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="break-all">{value}</dd>
          </div>
        ))}
      </dl>
      <section aria-labelledby="request-message" className="flex max-w-2xl flex-col gap-2">
        <h2 id="request-message" className="text-sm text-muted-foreground">
          {t("message")}
        </h2>
        <p className="rounded-xl border bg-card p-5 break-words whitespace-pre-wrap shadow-sm">{request.message}</p>
      </section>
      <RequestStatusSelect id={request.id} status={request.status} />
    </>
  );
}
