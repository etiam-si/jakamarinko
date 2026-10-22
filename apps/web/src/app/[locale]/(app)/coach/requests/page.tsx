import { Inbox } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { cn } from "cn";
import { RequestStatus } from "@jakamarinko/api";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";
import { StatusBadge } from "@/components/contact/status-badge";
import { Link } from "@/i18n/navigation";
import { listRequests } from "./fetch";

type Props = { searchParams: Promise<{ status?: string }> };

// The coach's inbox of contact form messages, newest first, filtered by ?status=.
export default async function RequestsPage({ searchParams }: Props) {
  const parsed = RequestStatus.safeParse((await searchParams).status);
  const status = parsed.success ? parsed.data : undefined;
  const t = await getTranslations("requests.inbox");
  const format = await getFormatter();
  const rows = await listRequests(status);

  const filters = [undefined, ...RequestStatus.options];
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <nav aria-label={t("filter")} className="flex flex-wrap gap-2">
        {filters.map((s) => (
          <Link
            key={s ?? "all"}
            href={{ pathname: "/coach/requests", query: s ? { status: s } : {} }}
            aria-current={s === status ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors hover:bg-accent",
              s === status && "border-primary bg-primary text-primary-foreground hover:bg-primary",
            )}
          >
            {s ? t(`statuses.${s}`) : t("all")}
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={status ? t("emptyFilteredTitle") : t("emptyTitle")}
          body={status ? t("emptyFilteredBody") : t("emptyBody")}
        />
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border bg-card">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/coach/requests/${r.id}`} className="flex flex-col gap-1 p-4 transition-colors hover:bg-accent/50">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className={cn("font-medium", r.status === "new" && "font-semibold")}>{r.name}</span>
                  <StatusBadge status={r.status} label={t(`statuses.${r.status}`)} />
                  <span className="ml-auto text-sm text-muted-foreground">
                    {format.dateTime(new Date(r.createdAt), { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Ljubljana" })}
                  </span>
                </div>
                <p className="line-clamp-1 text-sm break-all text-muted-foreground">{r.message}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
