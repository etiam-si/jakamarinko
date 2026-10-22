import { cn } from "cn";

const holes = ["top-4 left-4", "top-4 right-4", "bottom-4 left-4", "bottom-4 right-4"];
const zones = ["bg-zone-1", "bg-zone-2", "bg-zone-3", "bg-zone-4", "bg-zone-5"];

// The brand's race number, pinned on at a slight angle, with the error code as the number.
export function Bib({ number, className }: { number: string; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative flex aspect-[30/26] w-52 -rotate-3 flex-col items-center justify-center rounded-2xl bg-foreground text-background shadow-xl sm:w-64 md:w-80",
        className,
      )}
    >
      {holes.map((position) => (
        <span key={position} className={cn("absolute size-3 rounded-full bg-background md:size-4", position)} />
      ))}
      <span className="font-heading text-6xl leading-none font-extrabold tracking-tight font-stretch-expanded sm:text-7xl md:text-8xl">{number}</span>
      <span className="absolute inset-x-10 bottom-6 flex h-1.5 gap-0.5 overflow-hidden rounded-full md:bottom-8">
        {zones.map((zone) => (
          <span key={zone} className={cn("flex-1", zone)} />
        ))}
      </span>
    </div>
  );
}
