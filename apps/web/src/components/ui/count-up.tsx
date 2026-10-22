"use client"

import { useEffect, useRef } from "react"

const DURATION = 1100

// A whole number that counts up from 0 when it scrolls into view. The server renders the final value, so no-JS,
// crawlers, screen readers and reduced motion get it as is; anything that isn't a plain integer ("5th", "U20") stays
// static. Only numbers that start below the fold count: one already on screen never jumps back to 0.
export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    const target = /^\d+$/.test(value) ? Number(value) : null
    if (!el || target === null || target === 0) return
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return
    if (el.getBoundingClientRect().top < window.innerHeight) return
    el.textContent = "0"
    let frame = 0
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        observer.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / DURATION)
          // Out-expo: most of the count happens early, the last digits settle.
          const eased = t === 1 ? 1 : 1 - 2 ** (-10 * t)
          el.textContent = String(Math.round(eased * target))
          if (t < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.6 },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      el.textContent = value
    }
  }, [value])
  return (
    <span ref={ref} data-count-up={value} className={className}>
      {value}
    </span>
  )
}
