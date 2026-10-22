"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarOff, CalendarSync, CalendarX, RefreshCw } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";
import type { z } from "zod";
import { ApiErrorBody, CalendarChoice, CalendarStatus, ConnectCalendar, type ConnectResult } from "@jakamarinko/api";
import type { Locale } from "@jakamarinko/types";
import { EmptyState } from "@/components/app-shell/empty-state";
import { NoticeProvider, useNotice } from "@/components/coach-booking/notice";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { useRouter } from "@/i18n/navigation";

class ApiFailure extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

async function read<S extends z.ZodType>(res: Response, schema: S): Promise<z.infer<S>> {
  if (!res.ok) {
    const body = ApiErrorBody.safeParse(await res.json().catch(() => null));
    throw new ApiFailure(body.success ? body.data.error.code : "unknown");
  }
  return schema.parse(await res.json());
}

const statusKey = ["calendar", "status"];
const knownErrors = ["calendar_off", "needs_reconnect", "google_unavailable"] as const;

function useErrorText() {
  const t = useTranslations("calendar.errors");
  return (err: unknown) => {
    const code = err instanceof ApiFailure ? err.code : "";
    return (knownErrors as readonly string[]).includes(code) ? t(code as (typeof knownErrors)[number]) : t("generic");
  };
}

// Sends the browser to Google's consent screen; Google brings it back to this page with ?result=.
function useConnect() {
  const locale = useLocale() as Locale;
  return useMutation({
    mutationFn: async () => read(await api.calendar.google.connect.$post({ json: { locale } }), ConnectCalendar),
    onSuccess: ({ url }) => window.location.assign(url),
  });
}

export function CalendarSettings({ result }: { result?: ConnectResult }) {
  return (
    <NoticeProvider>
      <Settings result={result} />
    </NoticeProvider>
  );
}

function Settings({ result }: { result?: ConnectResult }) {
  const t = useTranslations("calendar");
  const notice = useNotice();
  const router = useRouter();
  const status = useQuery({
    queryKey: statusKey,
    queryFn: async () => read(await api.calendar.$get(), CalendarStatus),
    retry: false,
  });

  // Says how connecting went once, then drops ?result= so a reload doesn't repeat it.
  useEffect(() => {
    if (!result) return;
    notice(t(`result.${result}`));
    router.replace("/coach/settings/calendar");
  }, [result, notice, router, t]);

  if (status.error instanceof ApiFailure && status.error.code === "not_a_coach") {
    return <EmptyState icon={CalendarX} title={t("noCalendar.title")} body={t("noCalendar.body")} />;
  }
  if (status.error) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 p-4">
        <p>{t("loadError")}</p>
        <Button size="sm" variant="outline" onClick={() => status.refetch()}>
          {t("retry")}
        </Button>
      </div>
    );
  }
  if (!status.data) return <p className="text-muted-foreground">{t("loading")}</p>;

  const { available, connection } = status.data;
  if (!connection && !available) return <EmptyState icon={CalendarOff} title={t("off.title")} body={t("off.body")} />;
  if (!connection) return <Intro />;
  return <Connected connection={connection} available={available} />;
}

function Intro() {
  const t = useTranslations("calendar.intro");
  const connect = useConnect();
  const errorText = useErrorText();
  return (
    <EmptyState icon={CalendarSync} title={t("title")} body={t("body")}>
      <p className="max-w-xl text-sm text-pretty text-muted-foreground">{t("privacy")}</p>
      <Button onClick={() => connect.mutate()} loading={connect.isPending}>
        {t("connect")}
      </Button>
      {connect.error && (
        <p role="alert" className="text-sm text-destructive">
          {errorText(connect.error)}
        </p>
      )}
    </EmptyState>
  );
}

type Connection = NonNullable<CalendarStatus["connection"]>;

function Connected({ connection, available }: { connection: Connection; available: boolean }) {
  const t = useTranslations("calendar");
  const format = useFormatter();
  const client = useQueryClient();
  const notice = useNotice();
  const errorText = useErrorText();
  const connect = useConnect();
  const disconnect = useMutation({
    mutationFn: async () => {
      const res = await api.calendar.$delete();
      if (!res.ok) await read(res, ApiErrorBody);
    },
    onSuccess: () => {
      notice(t("connected.disconnected"));
      return client.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
  const ok = connection.status === "connected";

  return (
    <div className="flex flex-col gap-6">
      {!ok && (
        <section role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-card p-4 shadow-sm md:p-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">{t("reconnect.title")}</h2>
            <p className="max-w-xl text-pretty text-muted-foreground">{t("reconnect.body")}</p>
          </div>
          {available && (
            <Button onClick={() => connect.mutate()} loading={connect.isPending}>
              <RefreshCw aria-hidden />
              {t("reconnect.action")}
            </Button>
          )}
          {connect.error && <p className="text-sm text-destructive">{errorText(connect.error)}</p>}
        </section>
      )}

      <section aria-labelledby="calendar-connected" className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm md:p-6">
        <div className="flex flex-col gap-1">
          <h2 id="calendar-connected" className="text-lg font-semibold">
            {ok ? t("connected.title") : t("title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("connected.account", { account: connection.account })}</p>
          {ok && (
            <p className="text-sm text-muted-foreground">
              {connection.syncedAt
                ? t("connected.syncedAt", {
                    time: format.dateTime(new Date(connection.syncedAt), {
                      timeZone: "Europe/Ljubljana",
                      day: "numeric",
                      month: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  })
                : t("connected.notSynced")}
            </p>
          )}
        </div>
        {ok && available && <CalendarPicker connection={connection} />}
        <div className="flex flex-col items-start gap-2 border-t pt-4">
          <Button variant="destructive-outline" onClick={() => disconnect.mutate()} loading={disconnect.isPending}>
            {t("connected.disconnect")}
          </Button>
          <p className="text-sm text-muted-foreground">{t("connected.disconnectNote")}</p>
          {disconnect.error && (
            <p role="alert" className="text-sm text-destructive">
              {errorText(disconnect.error)}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function CalendarPicker({ connection }: { connection: Connection }) {
  const t = useTranslations("calendar.connected");
  const client = useQueryClient();
  const notice = useNotice();
  const errorText = useErrorText();
  const calendars = useQuery({
    queryKey: ["calendar", "calendars"],
    queryFn: async () => read(await api.calendar.calendars.$get(), CalendarChoice.array()),
    retry: false,
  });
  const save = useMutation({
    mutationFn: async (calendarId: string) => read(await api.calendar.$put({ json: { calendarId } }), CalendarStatus),
    onSuccess: (status) => {
      notice(t("saved", { name: status.connection?.calendarName ?? "" }));
      client.setQueryData(statusKey, status);
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="calendar-target">{t("calendar")}</Label>
      {calendars.error ? (
        <p className="text-sm text-destructive">{t("calendarsError")}</p>
      ) : (
        <Select
          value={connection.calendarId}
          onValueChange={(id) => save.mutate(id)}
          disabled={!calendars.data || save.isPending}
        >
          <SelectTrigger id="calendar-target" className="w-full max-w-sm">
            <SelectValue placeholder={connection.calendarName ?? connection.calendarId} />
          </SelectTrigger>
          <SelectContent>
            {(calendars.data ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name || c.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <p className="text-sm text-muted-foreground">{t("calendarHint")}</p>
      {save.error && (
        <p role="alert" className="text-sm text-destructive">
          {errorText(save.error)}
        </p>
      )}
    </div>
  );
}
