"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// The referral link, read-only, with a copy button and (where the phone offers it) the share sheet.
export function CopyShare({ url, shareText }: { url: string; shareText: string }) {
  const t = useTranslations("offers.referral");
  const id = useId();
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(typeof navigator.share === "function"), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      (document.getElementById(id) as HTMLInputElement | null)?.select();
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{t("link")}</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input id={id} value={url} readOnly onFocus={(e) => e.currentTarget.select()} className="font-mono" />
        <div className="flex gap-2">
          <Button type="button" size="lg" variant="outline" onClick={copy} className="flex-1">
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
            <span aria-live="polite">{copied ? t("copied") : t("copy")}</span>
          </Button>
          {canShare && (
            <Button type="button" size="lg" variant="outline" className="flex-1" onClick={() => navigator.share({ text: shareText, url }).catch(() => {})}>
              <Share2 aria-hidden />
              {t("share")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
