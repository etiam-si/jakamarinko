import { cn } from "cn";
import { ProcessingStatus } from "./processing-status";

export type BlockState =
  | { kind: "loading"; label: string }
  | { kind: "empty" }
  | { kind: "ready" }
  | { kind: "processing"; label: string; detail?: string; progress?: number };

type Props = {
  id: string;
  title: string;
  state: BlockState;
  // A link or button in the corner, e.g. "All bookings".
  action?: React.ReactNode;
  wide?: boolean;
  children?: React.ReactNode;
};

// The frame every overview block shares. loading: placeholder lines. processing: the shared status above
// whatever the block already has. empty and ready: the block's own content.
export function OverviewBlock({ id, title, state, action, wide, children }: Props) {
  const headingId = `block-${id}`;
  return (
    <section
      aria-labelledby={headingId}
      aria-busy={state.kind === "loading" || state.kind === "processing"}
      data-block={id}
      data-state={state.kind}
      className={cn(
        "flex flex-col gap-4 rounded-xl border bg-card p-5 text-card-foreground shadow-sm md:p-6",
        state.kind === "empty" && "border-dashed bg-card/60 shadow-none",
        wide && "md:col-span-2",
      )}
    >
      <header className="flex items-baseline justify-between gap-3">
        <h2 id={headingId} className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
          {title}
        </h2>
        {state.kind !== "loading" && action}
      </header>
      {state.kind === "loading" ? (
        <div className="flex flex-col gap-3">
          <span className="sr-only">{state.label}</span>
          <div aria-hidden className="h-6 w-2/3 animate-pulse rounded bg-muted" />
          <div aria-hidden className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          <div aria-hidden className="h-4 w-1/3 animate-pulse rounded bg-muted" />
        </div>
      ) : (
        <>
          {state.kind === "processing" && <ProcessingStatus label={state.label} detail={state.detail} progress={state.progress} />}
          {children}
        </>
      )}
    </section>
  );
}
