export type Climb = { age: number; seconds: number };

// "13:47" → 827
export function toSeconds(time: string) {
  const [min, sec] = time.split(":").map(Number);
  return min! * 60 + sec!;
}

// 827 → "13:47"
export const toTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

// The about.smarnaGora.times message ({ "12": "15:11", … }) as climbs sorted by age.
export const climbsFrom = (times: Record<string, string>): Climb[] =>
  Object.entries(times)
    .map(([age, time]) => ({ age: Number(age), seconds: toSeconds(time) }))
    .sort((a, b) => a.age - b.age);
