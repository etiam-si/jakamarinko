import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Loader2 } from "lucide-react"
import { Slot } from "radix-ui"

// Proportions from docs/design.md: 40 px default, 48 px for the one big call to action, 36 px inline. Below md every
// size from sm up is at least 44 px tall: a thumb, not a cursor. Press: a 2 % scale-down; the arrow nudges on hover.
// The base and variant styles are the .btn classes in globals.css (short class names keep the HTML small).
const buttonVariants = cva(
  "group/button btn",
  {
    variants: {
      variant: {
        default:
          "btn-default",
        outline:
          "btn-outline",
        secondary:
          "btn-secondary",
        ghost: "btn-ghost",
        destructive:
          "btn-destructive",
        "destructive-outline":
          "btn-destructive-outline",
        link: "btn-link",
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
