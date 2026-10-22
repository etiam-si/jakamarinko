import { cn } from "cn"
import type { LucideIcon } from "lucide-react"

const tones = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  signal: "bg-signal/15 text-foreground",
} as const

// One number at the top of an app page: label, value, an optional line under it.
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  className,
}: {
  label: string
  value: React.ReactNode
  hint?: string
  icon?: LucideIcon
  tone?: keyof typeof tones
  className?: string
}) {
  return (
    <div data-slot="stat-card" className={cn("flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm sm:p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", tones[tone])}>
            <Icon aria-hidden className="size-4" />
          </span>
        )}
      </div>
      <p className="font-heading text-2xl font-bold tracking-tight tabular-nums font-stretch-expanded">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
