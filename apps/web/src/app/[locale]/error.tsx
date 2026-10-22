"use client";

import { ErrorView } from "@/components/errors/error-view";

// Errors outside the public pages (account, coach, sign-in). Kept light: this boundary ships with every page.
export default function LocaleError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-dvh items-center">
      <ErrorView reset={reset} />
    </main>
  );
}
