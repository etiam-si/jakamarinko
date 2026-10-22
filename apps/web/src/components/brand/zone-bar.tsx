import { cn } from "cn";

export type Zone = {
  name: string;
  // Already formatted range, e.g. "128–142 bpm" or "4:45–5:10 /km".
  range: string;
  // Relative width of the segment, e.g. bpm span or share of training time. Equal widths if left out.
  share?: number;
};

const segment = [
  "bg-zone-1 text-zone-1-foreground",
  "bg-zone-2 text-zone-2-foreground",
  "bg-zone-3 text-zone-3-foreground",
  "bg-zone-4 text-zone-4-foreground",
  "bg-zone-5 text-zone-5-foreground",
];

// Five training zones as one bar plus a legend. Zones always carry their number, never colour alone.
export function ZoneBar({ zones, label, className }: { zones: Zone[]; label: string; className?: string }) {
  return (
    <figure className={cn("flex flex-col gap-3", className)}>
      <figcaption className="font-mono text-xs tracking-wider text-muted-foreground uppercase">{label}</figcaption>
      <div aria-hidden className="flex h-9 gap-0.5 overflow-hidden rounded-md">
        {zones.map((zone, i) => (
          <div key={zone.name} className={cn("flex items-center px-2 font-mono text-xs font-medium", segment[i])} style={{ flexGrow: zone.share ?? 1 }}>
            Z{i + 1}
          </div>
        ))}
      </div>
      <ol className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-5">
        {zones.map((zone, i) => (
          <li key={zone.name} className="flex justify-between gap-2 sm:flex-col">
            <span>
              <span className="font-mono text-xs text-muted-foreground">Z{i + 1}</span> {zone.name}
            </span>
            <span className="tabular-nums">{zone.range}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
