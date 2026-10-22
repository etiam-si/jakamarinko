import { cn } from "cn";
import type { LucideIcon } from "lucide-react";

// What a page or list shows before it has anything in it: icon, what's missing, and (as `children`) what to do.
// `inline` is the compact row for inside a card or a list.
export function EmptyState({
  icon: Icon,
  title,
  body,
  variant = "card",
  className,
  children,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  variant?: "card" | "inline";
  className?: string;
  children?: React.ReactNode;
}) {
  if (variant === "inline") {
    return (
      <section className={cn("flex flex-col items-start gap-4 rounded-xl border border-dashed p-4 sm:flex-row sm:items-center", className)}>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon aria-hidden className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-sm text-pretty text-muted-foreground">{body}</p>
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </section>
    );
  }
  return (
    <section
      className={cn("flex flex-col items-center gap-4 rounded-xl border border-dashed bg-card/50 px-6 py-12 text-center", className)}
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-border">
        <Icon aria-hidden className="size-6" />
      </span>
      <div className="flex max-w-sm flex-col gap-1.5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-pretty text-muted-foreground">{body}</p>
      </div>
      {children && <div className="flex flex-wrap justify-center gap-2 pt-2">{children}</div>}
    </section>
  );
}
