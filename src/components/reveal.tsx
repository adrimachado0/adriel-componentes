"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Very light fade-up the first time a section enters the viewport.
 * Pure CSS transition (see .reveal in globals.css) toggled by an
 * IntersectionObserver: content is only hidden when JS is running
 * (html.js) and motion is not reduced, so it can never stay invisible.
 */
export function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          element.dataset.revealed = "";
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
