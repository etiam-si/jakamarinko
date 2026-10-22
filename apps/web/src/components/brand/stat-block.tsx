import { cn } from "cn";

// A measured number: big tabular value, its unit, what it is. E.g. 80 ml/kg/min, VO₂max.
export function StatBlock({
  value,
  unit,
  label,
  className,
}: {
  value: string;
  unit?: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2 border-t border-border pt-3", className)}>
      <span aria-hidden className="-mt-[calc(0.75rem+1px)] mb-1 h-0.5 w-6 bg-signal" />
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-heading text-4xl leading-none font-extrabold tracking-tight tabular-nums font-stretch-expanded xl:text-5xl">
          {value}
        </span>
        {unit && <span className="font-mono text-sm text-muted-foreground">{unit}</span>}
      </p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
