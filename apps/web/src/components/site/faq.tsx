import { Plus } from "lucide-react";

// Questions as native <details>: works without JavaScript and is read by search engines. Each row is a 56 px tap
// target; the answer slides open where the browser can animate it (globals.css, .faq), and the plus turns into a cross.
// `children`: extra rows rendered elsewhere (PaymentFaq), after the listed ones.
export function Faq({ items, children }: { items: { question: string; answer: string }[]; children?: React.ReactNode }) {
  return (
    <div className="faq flex max-w-3xl flex-col divide-y divide-border border-y border-border">
      {items.map((item) => (
        <details key={item.question} className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium transition-colors duration-(--duration-fast) hover:text-primary [&::-webkit-details-marker]:hidden">
            {item.question}
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground transition-[rotate,background-color,color] duration-(--duration-base) ease-(--ease-out-quart) group-open:rotate-45 group-open:bg-primary group-open:text-primary-foreground"
            >
              <Plus className="size-4" />
            </span>
          </summary>
          <p className="max-w-2xl pr-12 pb-5 text-muted-foreground">{item.answer}</p>
        </details>
      ))}
      {children}
    </div>
  );
}
