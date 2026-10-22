import { cn } from "cn"
import { CircleAlert } from "lucide-react"

// One form field: label above, control, then a hint and/or an error. Fields in a form sit `gap-5` apart.
export function Field({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="field" className={cn("flex min-w-0 flex-col gap-2", className)} {...props} />
}

// Help under a control. Give it an id and point the control's aria-describedby at it.
export function FieldHint({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="field-hint" className={cn("text-sm text-muted-foreground", className)} {...props} />
}

// What is wrong with a field and how to fix it, right under it. Renders nothing without children.
export function FieldError({ className, children, ...props }: React.ComponentProps<"p">) {
  if (!children) return null
  return (
    <p data-slot="field-error" className={cn("flex items-start gap-1.5 text-sm font-medium text-destructive", className)} {...props}>
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  )
}

// The buttons at the end of a form: full width and stacked (primary on top) on phones, right-aligned from sm up.
export function FormActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="form-actions"
      className={cn(
        "flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end [&>*]:w-full sm:[&>*]:w-auto",
        className
      )}
      {...props}
    />
  )
}
