"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// The referral link, read-only, with a copy button and (where the phone offers it) the share sheet. The code also
// stands on its own line, and the field shows the end of the link, so a narrow phone never cuts the code off.
export function CopyShare({ url, code, shareText }: { url: string; code: string; shareText: string }) {
  const t = useTranslations("offers.referral");
  const id = useId();
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setCanShare(typeof navigator.share === "function");
    // Whenever the field gets its width (it can stream in hidden), show the end of the link.
    const el = field.current;
    if (!el) return;
    const toEnd = new ResizeObserver(() => (el.scrollLeft = el.scrollWidth));
    toEnd.observe(el);
    return () => toEnd.disconnect();
  }, []);

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
      <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
        <span className="text-muted-foreground">{t("codeLabel")}</span>
        <span className="font-mono text-base font-semibold tracking-wider" data-testid="referral-code">
          {code}
        </span>
      </p>
      <Label htmlFor={id}>{t("link")}</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input ref={field} id={id} value={url} readOnly onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 font-mono" />
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
