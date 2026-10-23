"use client";

import { useEffect, useRef, useState } from "react";

// The frame of the site header. Fixed, with a spacer of its full height in the flow, so its scroll states never move
// the page. Scrolled: translucent with a blur, a hairline and 8 px shorter. On phones it slides away while you read
// down and comes back as soon as you scroll up (never while something in it has focus).
export function HeaderBar({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);
  const header = useRef<HTMLElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      setScrolled(y > 8);
      // A few pixels of slack so a shaky thumb doesn't toggle it.
      if (Math.abs(y - last.current) > 6) {
        setHidden(y > last.current && y > 160 && !header.current?.contains(document.activeElement));
        last.current = y;
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <div aria-hidden className="h-[calc(4rem+env(safe-area-inset-top))]" />
      <header
        ref={header}
        data-scrolled={scrolled}
        data-hidden={hidden}
        className="group/header fixed inset-x-0 top-0 z-40 border-b border-transparent pt-[env(safe-area-inset-top)] transition-[background-color,border-color,box-shadow,translate] duration-300 ease-out data-[scrolled=true]:border-border/70 data-[scrolled=true]:bg-background/75 data-[scrolled=true]:shadow-[0_8px_24px_-16px_rgb(18_26_24/0.18)] data-[scrolled=true]:backdrop-blur-xl data-[scrolled=true]:backdrop-saturate-150 motion-reduce:transition-none max-lg:data-[hidden=true]:-translate-y-full"
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 transition-[height] duration-300 ease-out group-data-[scrolled=true]/header:h-14 motion-reduce:transition-none md:px-8">
          {children}
        </div>
      </header>
    </>
  );
}
