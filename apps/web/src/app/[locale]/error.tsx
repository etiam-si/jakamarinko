"use client";

import { LazyErrorView as ErrorView } from "@/components/errors/lazy-error-view";

// Errors outside the public pages (account, coach, sign-in).
export default function LocaleError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-dvh items-center">
      <ErrorView reset={reset} />
    </main>
  );
}
