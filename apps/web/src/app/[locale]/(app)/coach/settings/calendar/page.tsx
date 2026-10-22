import { getTranslations } from "next-intl/server";
import { ConnectResult } from "@jakamarinko/api";
import { PageHeader } from "@/components/app-shell/page-header";
import { CalendarSettings } from "./calendar-settings";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Google Calendar sync (T16). Google sends the coach back here with ?result=.
export default async function CalendarPage({ searchParams }: Props) {
  const t = await getTranslations("calendar");
  const result = ConnectResult.safeParse((await searchParams).result);
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <CalendarSettings result={result.success ? result.data : undefined} />
    </>
  );
}
