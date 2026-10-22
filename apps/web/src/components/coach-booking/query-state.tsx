"use client";

import { CalendarX } from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/app-shell/empty-state";
import { Button } from "@/components/ui/button";
import { ApiFailure } from "./data";

// What a coach screen shows while its data loads or when it fails. A user without a calendar of their own
// (an owner who doesn't coach) is told to pick one instead of seeing an error.
export function QueryState({ query }: { query: { isPending: boolean; error: unknown; refetch: () => unknown } }) {
  const t = useTranslations("coach-booking");
  if (query.error instanceof ApiFailure && query.error.code === "not_a_coach") {
    return <EmptyState icon={CalendarX} title={t("noCalendar.title")} body={t("noCalendar.body")} />;
  }
  if (query.error) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 p-4">
        <p>{t("loadError")}</p>
        <Button size="sm" variant="outline" onClick={() => query.refetch()}>
          {t("retry")}
        </Button>
      </div>
    );
  }
  return <p className="text-muted-foreground">{t("loading")}</p>;
}
