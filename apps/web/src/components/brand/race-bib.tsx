import { cn } from "cn";

const pins = ["top-2 left-2", "top-2 right-2", "bottom-2 left-2", "bottom-2 right-2"];

// One measured number printed like a race bib: four safety-pin holes, a label, the number, its unit. The logo's
// idea as a data plate. Laid over the hero photo; it rises in after the photo has settled.
export function RaceBib({ label, value, unit, className }: { label: string; value: string; unit?: string; className?: string }) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-1 rounded-xl border border-foreground/5 bg-card px-6 pt-4 pb-5 text-card-foreground shadow-xl motion-safe:animate-rise motion-safe:[animation-delay:450ms]",
        className,
      )}
    >
      {pins.map((pin) => (
        <span key={pin} aria-hidden className={cn("absolute size-1.5 rounded-full bg-background shadow-[inset_0_1px_1px_rgb(18_26_24/0.25)]", pin)} />
      ))}
      <p className="font-mono text-xs tracking-wider text-muted-foreground uppercase">{label}</p>
      <p className="flex items-baseline gap-2">
        <span className="font-heading text-5xl leading-none font-extrabold tracking-tight tabular-nums font-stretch-expanded">{value}</span>
        {unit && <span className="font-mono text-xs text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}
