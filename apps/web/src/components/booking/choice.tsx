import { cn } from "cn";

// A native radio button that looks like a tile: keyboard and screen readers get a plain radio group.
export function Choice({
  name,
  value,
  checked,
  onChange,
  className,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-input bg-card px-3 py-2 text-center shadow-xs transition-[color,background-color,border-color,box-shadow] hover:border-foreground/25 hover:bg-muted/60",
        "has-[:focus-visible]:border-primary has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/20",
        checked && "border-primary bg-primary text-primary-foreground shadow-sm hover:border-primary hover:bg-primary/90",
        className,
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} className="sr-only" />
      {children}
    </label>
  );
}
