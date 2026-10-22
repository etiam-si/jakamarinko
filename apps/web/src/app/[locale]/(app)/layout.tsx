import type { Metadata } from "next";

// Signed-in areas: never in search results. The guards and the frame live in coach/ and account/.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
