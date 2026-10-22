"use client";

import { LazyErrorView as ErrorView } from "@/components/errors/lazy-error-view";

// A public page that fails keeps the header and footer around the error.
export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main>
      <ErrorView reset={reset} />
    </main>
  );
}
