import { ChevronDown } from "lucide-react";
import { FaqJsonLd } from "./json-ld";

// Questions as native <details>: works without JavaScript and is read by search engines, with the same questions as
// FAQPage structured data.
export function Faq({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <>
      <FaqJsonLd items={items} />
      <div className="flex max-w-3xl flex-col divide-y divide-border border-y border-border">
        {items.map((item) => (
          <details key={item.question} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
              {item.question}
              <ChevronDown aria-hidden className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="pt-3 text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </div>
    </>
  );
}
