"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

// Mount once per layout. Marks every [data-reveal] below the fold as "pending" (hidden by globals.css) and sets it "in"
// as it scrolls into view. What is already on screen is never touched, so the first paint and LCP don't wait for it.
// Runs again on every client-side navigation; does nothing for reduced motion.
export function Reveal() {
  const pathname = usePathname()
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.setAttribute("data-reveal", "in")
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    )
    for (const el of document.querySelectorAll<HTMLElement>("[data-reveal]")) {
      if (el.dataset.reveal) continue
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) continue
      el.dataset.reveal = "pending"
      observer.observe(el)
    }
    return () => observer.disconnect()
  }, [pathname])
  return null
}
