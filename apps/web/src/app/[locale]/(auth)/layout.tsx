// Sign-in and consent: one narrow column in the middle of the page.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 px-6 py-16">{children}</main>;
}
