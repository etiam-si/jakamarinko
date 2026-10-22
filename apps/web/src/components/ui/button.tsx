import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Loader2 } from "lucide-react"
import { Slot } from "radix-ui"

// Proportions from docs/design.md: 40 px default, 48 px for the one big call to action, 36 px inline. Below md every
// size from sm up is at least 44 px tall: a thumb, not a cursor. Press: a 2 % scale-down; the arrow nudges on hover.
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-[color,background-color,border-color,box-shadow,translate,scale,filter] duration-(--duration-fast) ease-(--ease-out-quart) outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_.lucide-arrow-right]:transition-transform [&_.lucide-arrow-right]:duration-(--duration-base) [&_.lucide-arrow-right]:ease-(--ease-out-quart) hover:[&_.lucide-arrow-right]:translate-x-0.5",
  {
    variants: {
      variant: {
        default:
          "bg-linear-to-b from-primary to-primary-deep text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.14),var(--shadow-sm)] hover:-translate-y-px hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.18),var(--shadow-md)] hover:brightness-115 active:translate-y-0 active:brightness-95 motion-reduce:hover:translate-y-0",
        outline:
          "border-input bg-card text-foreground shadow-xs hover:border-foreground/30 hover:bg-muted/50 hover:shadow-sm aria-expanded:bg-muted dark:bg-input/20 dark:hover:bg-input/40",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)] aria-expanded:bg-secondary",
        ghost: "font-medium hover:bg-muted hover:text-foreground aria-expanded:bg-muted dark:hover:bg-muted/60",
        destructive:
          "bg-destructive text-white shadow-sm hover:bg-destructive/90 hover:shadow-md focus-visible:ring-destructive/25 dark:text-background",
        "destructive-outline":
          "border-destructive/30 bg-card text-destructive hover:bg-destructive/10 focus-visible:ring-destructive/25",
        link: "h-auto px-0 font-medium text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 has-[>svg]:px-4 max-md:h-11",
        xs: "h-8 gap-1.5 rounded-md px-3 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-9 gap-1.5 px-4 has-[>svg]:px-3 max-md:h-11",
        lg: "h-12 px-7 text-base has-[>svg]:px-6",
        icon: "size-10 max-md:size-11",
        "icon-xs": "size-8 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-9 max-md:size-11",
        "icon-lg": "size-12",
      },
    },
    compoundVariants: [{ variant: "link", class: "h-auto px-0 has-[>svg]:px-0" }],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// `loading` disables the button and puts a spinner before its label (not with asChild: links don't load).
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Loader2 aria-hidden className="animate-spin" />}
          {children}
        </>
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
