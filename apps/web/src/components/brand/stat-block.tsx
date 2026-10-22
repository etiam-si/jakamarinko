import { cn } from "cn";
import { CountUp } from "@/components/ui/count-up";

// A measured number: big tabular value, its unit, what it is. E.g. 80 ml/kg/min, VO₂max. Plain integers count up
// from 0 the first time they scroll into view (CountUp); anything else ("5th", "U20") is shown as is.
export function StatBlock({
  value,
  unit,
  label,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  value: string;
  unit?: string;
  label: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 border-t border-border pt-4", className)} {...props}>
      <span aria-hidden className="-mt-[calc(1rem+1px)] mb-1 h-0.5 w-8 bg-signal" />
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <CountUp
          value={value}
          className="font-heading text-5xl leading-none font-extrabold tracking-tight tabular-nums font-stretch-expanded xl:text-6xl"
        />
        {unit && <span className="font-mono text-sm text-muted-foreground">{unit}</span>}
      </p>
      <p className="text-sm text-pretty text-muted-foreground">{label}</p>
    </div>
  );
}
