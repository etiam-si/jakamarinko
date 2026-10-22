import { cn } from "cn";
import { type Climb, toTime } from "./climbs";

// The Šmarna gora times by age as a light, server-rendered chart: faster is higher, each climb a dot with its time,
// the goal a signal dot at the end of a dashed line. Lines are SVG stretched to the box (strokes keep their width);
// dots and labels are HTML on top, so the text stays crisp and readable at any width. On phones only the first and the
// latest time are labelled. The page renders the numbers as a table for screen readers, so this is hidden from them.
export function ClimbChart({ climbs, goal, ageLabel, className }: { climbs: Climb[]; goal: Climb; ageLabel: (age: number) => string; className?: string }) {
  const minAge = climbs[0]!.age;
  const slowest = Math.max(...climbs.map((c) => c.seconds));
  const lo = goal.seconds - 30;
  const hi = slowest + 30;
  const x = (age: number) => ((age - minAge) / (goal.age - minAge)) * 100;
  const y = (seconds: number) => ((seconds - lo) / (hi - lo)) * 100;
  const last = climbs[climbs.length - 1]!;
  const points = climbs.map((c) => `${x(c.age)},${y(c.seconds)}`).join(" ");

  return (
    <div aria-hidden className={cn("flex flex-col gap-3", className)}>
      <div className="relative mx-4 mt-8 mb-2 h-56 md:mx-6 md:h-72">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
          {[0, 25, 50, 75, 100].map((line) => (
            <line key={line} x1={0} x2={100} y1={line} y2={line} className="stroke-border" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          ))}
          <polyline
            points={points}
            fill="none"
            className="draw-path stroke-primary"
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            pathLength={1}
            strokeDasharray={1}
          />
          <line
            x1={x(last.age)}
            y1={y(last.seconds)}
            x2={x(goal.age)}
            y2={y(goal.seconds)}
            className="stroke-signal"
            strokeWidth={2}
            strokeDasharray="4 5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {climbs.map((c, i) => {
          const labelled = i === 0 || i === climbs.length - 1;
          return (
            <div key={c.age} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x(c.age)}%`, top: `${y(c.seconds)}%` }}>
              <span className="block size-3 rounded-full border-2 border-card bg-primary shadow-sm" />
              <span
                className={cn(
                  "absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 font-mono text-xs whitespace-nowrap tabular-nums",
                  labelled ? "font-medium text-foreground" : "hidden text-muted-foreground sm:block",
                )}
              >
                {toTime(c.seconds)}
              </span>
            </div>
          );
        })}
        <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x(goal.age)}%`, top: `${y(goal.seconds)}%` }}>
          <span className="block size-4 rounded-full border-2 border-card bg-signal shadow-sm" />
          <span className="absolute right-0 bottom-full mb-1.5 font-mono text-xs font-medium whitespace-nowrap tabular-nums">{toTime(goal.seconds)}</span>
        </div>
      </div>
      <div className="relative mx-4 h-5 md:mx-6">
        {[...climbs, goal].map((c, i) => (
          <span
            key={c.age}
            className={cn(
              "absolute font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums",
              i === 0 ? "" : i === climbs.length ? "-translate-x-full" : "hidden -translate-x-1/2 sm:inline",
            )}
            style={{ left: `${x(c.age)}%` }}
          >
            {i === 0 ? ageLabel(c.age) : c.age}
          </span>
        ))}
      </div>
    </div>
  );
}
