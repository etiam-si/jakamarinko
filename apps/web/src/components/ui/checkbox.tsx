"use client"

import * as React from "react"
import { cn } from "cn"
import { Checkbox as CheckboxPrimitive } from "radix-ui"
import { CheckIcon } from "lucide-react"

// A 20 px box inside a 44 px tap target. The negative margins (inline, so a caller's `mt-0.5` can't undo them) keep
// the footprint of the 20 px box, nudged 2 px down to sit on the first line of the label next to it.
const hitArea: React.CSSProperties = { margin: "-0.625rem -0.75rem -0.75rem" }

function Checkbox({
  className,
  style,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      style={{ ...hitArea, ...style }}
      className={cn(
        "peer group/checkbox relative flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg outline-none disabled:cursor-not-allowed disabled:opacity-50 group-has-disabled/field:opacity-50",
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className="flex size-5 items-center justify-center rounded-[6px] border border-input bg-card text-primary-foreground shadow-xs transition-[background-color,border-color,box-shadow] duration-(--duration-fast) group-hover/checkbox:border-foreground/30 group-focus-visible/checkbox:border-primary group-focus-visible/checkbox:ring-[3px] group-focus-visible/checkbox:ring-ring/25 group-aria-invalid/checkbox:border-destructive group-aria-invalid/checkbox:ring-3 group-aria-invalid/checkbox:ring-destructive/20 group-data-[state=checked]/checkbox:border-primary group-data-[state=checked]/checkbox:bg-primary dark:bg-input/30 dark:group-data-[state=checked]/checkbox:bg-primary"
      >
        <CheckboxPrimitive.Indicator
          data-slot="checkbox-indicator"
          className="grid place-content-center text-current data-[state=checked]:animate-in data-[state=checked]:zoom-in-50 data-[state=checked]:duration-200 data-[state=checked]:ease-(--ease-out-expo) [&>svg]:size-3.5"
        >
          <CheckIcon />
        </CheckboxPrimitive.Indicator>
      </span>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
