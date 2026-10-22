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
        "flex cursor-pointer items-center justify-center rounded-md border border-border px-3 py-2 text-center transition-colors hover:bg-muted",
        "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:border-ring",
        checked && "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
        className,
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} className="sr-only" />
      {children}
    </label>
  );
}
