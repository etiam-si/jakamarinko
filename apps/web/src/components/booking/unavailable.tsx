import { useTranslations } from "next-intl";

// When the api is down or a booking fails for a reason the customer can't fix: book by phone or email instead.
export function Unavailable() {
  const t = useTranslations("booking.unavailable");
  const contact = useTranslations("contact");
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <p>{t("text")}</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-muted-foreground">{t("phone")}</dt>
        <dd>
          <a href={contact("phone.href")} className="font-medium text-primary underline-offset-4 hover:underline">
            {contact("phone.value")}
          </a>
        </dd>
        <dt className="text-muted-foreground">{t("email")}</dt>
        <dd className="break-all">
          <a href={contact("email.href")} className="font-medium text-primary underline-offset-4 hover:underline">
            {contact("email.value")}
          </a>
        </dd>
      </dl>
    </div>
  );
}
