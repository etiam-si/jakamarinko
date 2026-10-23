import { cn } from "cn"
import { Loader2 } from "lucide-react"

export type StatusTone = "success" | "warning" | "error" | "info" | "neutral" | "primary"

// Text on its own 10 % tint; every pair is checked for contrast in styles/theme.test.ts.
const tones: Record<StatusTone, string> = {
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  error: "border-destructive/25 bg-destructive/10 text-destructive",
  info: "border-info/25 bg-info/10 text-info",
  neutral: "border-border bg-muted text-muted-foreground",
  primary: "border-primary/20 bg-primary/10 text-primary",
}

const dots: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-destructive",
  info: "bg-info",
  neutral: "bg-muted-foreground",
  primary: "bg-primary",
}

// A state in one or two words: Confirmed, New, Cancelled. `dot` for live states, `loading` while something runs.
export function StatusBadge({
  tone,
  dot = false,
  loading = false,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"span">, "children"> & {
  tone: StatusTone
  dot?: boolean
  loading?: boolean
  children: React.ReactNode
}) {
  return (
    <span
      data-slot="status-badge"
      className={cn(
        "inline-flex h-6 w-fit shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold whitespace-nowrap",
        tones[tone],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 aria-hidden className="size-3 animate-spin" />
      ) : (
        dot && <span aria-hidden className={cn("size-1.5 rounded-full", dots[tone])} />
      )}
      {children}
    </span>
  )
}
