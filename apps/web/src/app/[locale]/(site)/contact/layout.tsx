import { use } from "react";
import { ClientMessages } from "@/i18n/client-messages";

// The contact form is a client component: it gets its own texts.
export default function ContactLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  return (
    <ClientMessages locale={use(params).locale} messages={["requests.form"]}>
      {children}
    </ClientMessages>
  );
}
