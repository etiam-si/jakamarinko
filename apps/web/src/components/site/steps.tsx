import { cn } from "cn";

// Cool to hot, like the zones the steps lead to.
const markers = [
  "bg-zone-1 text-zone-1-foreground",
  "bg-zone-2 text-zone-2-foreground",
  "bg-zone-4 text-zone-4-foreground",
  "bg-zone-5 text-zone-5-foreground",
];

// A real sequence (test → zones → plan → progress) as one track: numbered markers in the zone colours joined by a
// line, down the left edge on phones and across on large screens (`vertical`: down at every width, for a half-width
// column). A step can be a single line of text without a title. Steps come in one after another on reveal.
export function Steps({ items, vertical = false }: { items: { title?: string; text: string }[]; vertical?: boolean }) {
  const across = !vertical;
  return (
    <ol className={cn("grid", across && "lg:grid-cols-4")}>
      {items.map((item, i) => (
        <li
          key={item.text}
          data-reveal-item
          style={{ "--i": i } as React.CSSProperties}
          className={cn(
            "relative grid grid-cols-[2.5rem_1fr] gap-x-5 pb-10 last:pb-0",
            across && "lg:grid-cols-1 lg:gap-y-6 lg:pr-8 lg:pb-0",
            !item.title && "pb-8",
          )}
        >
          {i < items.length - 1 && (
            <span
              aria-hidden
              className={cn(
                "absolute top-12 bottom-2 left-5 w-px bg-border",
                across && "lg:top-5 lg:right-2 lg:bottom-auto lg:left-14 lg:h-px lg:w-auto",
              )}
            />
          )}
          <span
            aria-hidden
            className={cn("relative flex size-10 items-center justify-center rounded-full font-mono text-sm font-medium tabular-nums shadow-sm", markers[i % markers.length])}
          >
            {i + 1}
          </span>
          {item.title ? (
            <div className={cn("flex flex-col gap-2 pt-1.5", across && "lg:pt-0")}>
              <h3 className="font-heading text-xl font-bold font-stretch-expanded">{item.title}</h3>
              <p className="text-muted-foreground">{item.text}</p>
            </div>
          ) : (
            <p className="self-center text-pretty">{item.text}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
