import type { LucideIcon } from "lucide-react";

// What a page shows before it has anything in it. `children`: an optional action.
export function EmptyState({
  icon: Icon,
  title,
  body,
  children,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col items-start gap-4 rounded-lg border border-dashed bg-card/60 p-6 md:p-10">
      <span className="flex size-11 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
        <Icon aria-hidden className="size-5" />
      </span>
      <div className="flex max-w-xl flex-col gap-1.5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-pretty text-muted-foreground">{body}</p>
      </div>
      {children}
    </section>
  );
}
