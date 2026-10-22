"use client";

import { CartesianGrid, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { type Climb, toTime } from "./climbs";

// The Šmarna gora times by age, with the goal as a marker (its text sits under the chart). The page also renders
// the numbers as a table for screen readers, so the chart itself is hidden from them.
export function SmarnaGoraChart({
  climbs,
  goal,
  labels,
}: {
  climbs: Climb[];
  goal: Climb;
  labels: { age: string; time: string };
}) {
  // Whole minutes from just under the goal to just over the slowest climb.
  const first = Math.floor(goal.seconds / 60) - (goal.seconds % 60 === 0 ? 1 : 0);
  const last = Math.ceil(Math.max(...climbs.map((c) => c.seconds)) / 60);
  const ticks = Array.from({ length: last - first + 1 }, (_, i) => (first + i) * 60);
  return (
    <div aria-hidden className="h-72 w-full md:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={climbs} margin={{ top: 24, right: 24, bottom: 24, left: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="age"
            type="number"
            domain={[climbs[0]!.age, goal.age]}
            ticks={[...climbs.map((c) => c.age), goal.age]}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            stroke="var(--border)"
            label={{ value: labels.age, position: "insideBottom", offset: -16, fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <YAxis
            domain={[ticks[0]!, ticks.at(-1)!]}
            ticks={ticks}
            tickFormatter={toTime}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            stroke="var(--border)"
            width={48}
          />
          <Tooltip
            formatter={(value) => [toTime(Number(value)), labels.time]}
            labelFormatter={(age) => `${labels.age} ${age}`}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: "var(--popover-foreground)",
            }}
          />
          <Line
            type="monotone"
            dataKey="seconds"
            stroke="var(--chart-1)"
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: "var(--chart-1)" }}
            isAnimationActive={false}
          />
          <ReferenceDot
            x={goal.age}
            y={goal.seconds}
            r={6}
            fill="var(--signal)"
            stroke="var(--background)"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
