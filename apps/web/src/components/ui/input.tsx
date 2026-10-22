import * as React from "react"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 px-3.5 py-2 rounded-lg border border-input bg-card text-base shadow-xs transition-[color,box-shadow,border-color] outline-none placeholder:text-muted-foreground/70 hover:border-foreground/25 focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/15 dark:bg-input/20 dark:aria-invalid:ring-destructive/30 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
