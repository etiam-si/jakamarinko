import { LocaleSwitcher } from "@/components/i18n/locale-switcher";

// Placeholder: the public site layout (header, footer) comes with T08.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="flex justify-end p-4">
        <LocaleSwitcher />
      </header>
      {children}
    </>
  );
}
