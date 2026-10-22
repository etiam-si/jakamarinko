"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { ApiErrorBody, type AccountBooking } from "@jakamarinko/api";
import type { Locale } from "@jakamarinko/types";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { formatDay, formatTime } from "./format";

// Free cancellation up to 24 h before (T07's rule, checked again by the api). After that: call or write.
export function CancelBooking({ booking }: { booking: AccountBooking }) {
  const t = useTranslations("account.booking");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  if (!booking.cancellable) return <p className="text-sm text-muted-foreground">{t("tooLate")}</p>;

  async function cancel() {
    setPending(true);
    setError(undefined);
    const res = await api.booking[":id"].cancel.$post({ param: { id: booking.id }, query: {} });
    setPending(false);
    if (res.ok) {
      setOpen(false);
      return router.refresh();
    }
    const code = ApiErrorBody.safeParse(await res.json().catch(() => null)).data?.error.code;
    setError(t(code === "too_late" ? "tooLate" : "cancelError"));
  }

  const date = `${formatDay(booking.start, locale)}, ${formatTime(booking.start, locale)}`;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive-outline" className="h-11">
          {t("cancel")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("cancelTitle")}</DialogTitle>
          <DialogDescription>{t("cancelBody", { service: booking.serviceName, date })}</DialogDescription>
        </DialogHeader>
        {error && <FieldError role="alert">{error}</FieldError>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="max-sm:h-11">{t("keep")}</Button>
          </DialogClose>
          <Button variant="destructive" className="max-sm:h-11" onClick={cancel} loading={pending}>
            {t("cancelConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
