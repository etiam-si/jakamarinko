"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// The query cache for the parts that load data in the browser (booking, account, coach), not every page.
// One QueryClient per browser tab.
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } }));
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
