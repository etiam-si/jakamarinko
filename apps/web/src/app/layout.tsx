import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jaka Marinko",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sl">
      <body>{children}</body>
    </html>
  );
}
