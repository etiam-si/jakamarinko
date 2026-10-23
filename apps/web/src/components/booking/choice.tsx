import { cn } from "cn";

// A native radio button that looks like a tile: keyboard and screen readers get a plain radio group.
// `chip`: a compact tile that fills with spruce when picked (days, times). `card`: a full-width row with a radio dot
// that gets a spruce outline when picked (services). `label` names the radio when its visible text is split up.
export function Choice({
  name,
  value,
  checked,
  onChange,
  variant = "chip",
  label,
  className,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  variant?: "chip" | "card";
  label?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "group/choice relative flex min-h-11 cursor-pointer items-center rounded-lg border border-input bg-card shadow-xs transition-[color,background-color,border-color,box-shadow,scale] duration-150 select-none hover:border-foreground/30 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
        "has-[:focus-visible]:border-primary has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/25",
        variant === "chip" && "justify-center px-3 py-2 text-center",
        variant === "chip" && checked && "border-primary bg-primary text-primary-foreground shadow-sm hover:border-primary",
        variant === "card" && "gap-4 rounded-xl p-4 text-left",
        variant === "card" && checked && "border-primary bg-primary/[0.04] ring-1 ring-primary hover:border-primary",
        className,
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        aria-label={label}
        className="sr-only"
      />
      {variant === "card" && (
        <span
          aria-hidden
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150 motion-reduce:transition-none",
            checked ? "border-primary" : "border-input group-hover/choice:border-foreground/40",
          )}
        >
          <span
            className={cn(
              "size-2.5 rounded-full bg-primary transition-transform duration-200 motion-reduce:transition-none",
              checked ? "scale-100" : "scale-0",
            )}
          />
        </span>
      )}
      {children}
    </label>
  );
}
