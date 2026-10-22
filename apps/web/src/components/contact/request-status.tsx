"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { RequestStatus } from "@jakamarinko/api";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";

// The status picker on a request's page. Saves right away.
export function RequestStatusSelect({ id, status: initial }: { id: string; status: RequestStatus }) {
  const t = useTranslations("requests.inbox");
  const router = useRouter();
  const [status, setStatus] = useState(initial);
  const [pending, setPending] = useState(false);

  async function change(next: RequestStatus) {
    const previous = status;
    setStatus(next);
    setPending(true);
    const res = await api.requests[":id"].$patch({ param: { id }, json: { status: next } }).catch(() => undefined);
    setPending(false);
    if (!res?.ok) {
      setStatus(previous);
      return toast.error(t("statusError"));
    }
    toast.success(t("statusSaved", { status: t(`statuses.${next}`) }));
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="request-status">{t("status")}</Label>
      <Select value={status} onValueChange={(v) => change(v as RequestStatus)} disabled={pending}>
        <SelectTrigger id="request-status" className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RequestStatus.options.map((s) => (
            <SelectItem key={s} value={s}>
              {t(`statuses.${s}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
