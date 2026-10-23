import { cn } from "cn";

// A plain <select> styled like Input: 44 px tall, 16 px text (no zoom on phones), the native picker on touch screens.
export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-11 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-base shadow-xs outline-none hover:border-foreground/25 focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/20 aria-invalid:border-destructive dark:bg-input/20",
        className,
      )}
      {...props}
    />
  );
}
