"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const NoticeContext = createContext<(text: string) => void>(() => {});

// A short confirmation at the bottom of the screen ("Booking moved."), read out by screen readers.
export function NoticeProvider({ children }: { children: React.ReactNode }) {
  const [text, setText] = useState<string>();
  const [key, setKey] = useState(0);
  const show = useCallback((next: string) => {
    setText(next);
    setKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!text) return;
    const timer = setTimeout(() => setText(undefined), 5000);
    return () => clearTimeout(timer);
  }, [text, key]);

  return (
    <NoticeContext.Provider value={show}>
      {children}
      <div role="status" aria-live="polite" data-notice className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
        {text && (
          <p key={key} className="rounded-md bg-foreground px-4 py-2.5 text-sm text-background shadow-lg">
            {text}
          </p>
        )}
      </div>
    </NoticeContext.Provider>
  );
}

export const useNotice = () => useContext(NoticeContext);
