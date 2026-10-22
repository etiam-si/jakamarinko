import { cn } from "cn";

type Props = {
  label: string;
  // A line under the label, e.g. which step is running.
  detail?: string;
  // 0 to 1 when the job knows how far it is; without it the bar just moves.
  progress?: number;
  className?: string;
};

// Something is being worked on: a live job, a report on its way. Shared by every overview block and by later
// phases that stream job status; it has no state of its own, so a client component can re-render it as updates come.
export function ProcessingStatus({ label, detail, progress, className }: Props) {
  const known = progress !== undefined;
  const percent = Math.round(Math.min(1, Math.max(0, progress ?? 0)) * 100);
  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col gap-2.5", className)}>
      <p className="flex items-center gap-2 text-sm font-medium">
        <span aria-hidden className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex size-2 rounded-full bg-signal" />
        </span>
        {label}
      </p>
      {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={known ? percent : undefined}
        className="h-1 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn(
            "h-full rounded-full bg-signal transition-[width] duration-500",
            !known && "w-full animate-pulse motion-reduce:animate-none",
          )}
          style={known ? { width: `${percent}%` } : undefined}
        />
      </div>
    </div>
  );
}
