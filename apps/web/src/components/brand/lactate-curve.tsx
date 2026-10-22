import { cn } from "cn";

// Zone bands under the curve, in the zone colours (width in viewBox units, cool to hot).
const bands = [
  { x: 0, w: 92, zone: "var(--zone-1)" },
  { x: 92, w: 72, zone: "var(--zone-2)" },
  { x: 164, w: 52, zone: "var(--zone-3)" },
  { x: 216, w: 48, zone: "var(--zone-4)" },
  { x: 264, w: 56, zone: "var(--zone-5)" },
];

// What a lactate profile looks like: flat, then bending up past the two thresholds, over the five zones. An
// illustration with no numbers on it, not anyone's result. The curve draws itself in when it comes into view
// (globals.css, .draw-path). `labels`: the axis names, when the drawing stands alone.
export function LactateCurve({ labels, className }: { labels?: { x: string; y: string }; className?: string }) {
  return (
    <figure aria-hidden className={cn("flex flex-col gap-2", className)}>
      <div className="flex gap-2">
        {labels && <span className="font-mono text-xs text-muted-foreground [writing-mode:vertical-rl] rotate-180">{labels.y}</span>}
        <svg viewBox="0 0 320 180" className="w-full overflow-visible">
          {bands.map((band) => (
            <rect key={band.x} x={band.x} y={0} width={band.w} height={168} fill={band.zone} opacity={0.22} />
          ))}
          {bands.map((band, i) => (
            <text key={band.x} x={band.x + 8} y={20} className="fill-muted-foreground font-mono" fontSize={12}>
              Z{i + 1}
            </text>
          ))}
          <line x1={0} y1={168} x2={320} y2={168} className="stroke-foreground/30" strokeWidth={1} />
          <path
            className="draw-path stroke-foreground"
            d="M 6 150 C 70 150, 120 146, 164 136 S 236 108, 262 76 S 300 22, 314 10"
            fill="none"
            strokeWidth={3}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
          />
          <circle cx={164} cy={136} r={5} className="fill-card stroke-foreground" strokeWidth={2.5} />
          <circle cx={262} cy={76} r={6} className="fill-signal stroke-card" strokeWidth={2.5} />
          <text x={164} y={122} textAnchor="middle" className="fill-foreground font-mono font-medium" fontSize={12}>
            LT1
          </text>
          <text x={248} y={66} textAnchor="end" className="fill-foreground font-mono font-medium" fontSize={12}>
            LT2
          </text>
        </svg>
      </div>
      {labels && <span className="self-end font-mono text-xs text-muted-foreground">{labels.x} →</span>}
    </figure>
  );
}
