"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger delay in ms. */
  delay?: number;
};

/**
 * Fades + lifts its children into view on scroll. Respects reduced-motion
 * via the `motion-reduce` variant + the global media query.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Visible is the safe default: server-rendered and no-JS pages should never
  // hide their content for the sake of an optional entrance animation.
  const [shown, setShown] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (
      !el ||
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    // Keep anything already in or near the first viewport visible. Only
    // below-the-fold content is prepared for a scroll-triggered reveal.
    if (el.getBoundingClientRect().top <= window.innerHeight * 1.05) {
      return;
    }

    setShown(false);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-700 ease-out motion-reduce:transition-none",
        shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
