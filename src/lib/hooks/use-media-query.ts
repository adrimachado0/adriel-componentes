"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Matches Tailwind's `sm` breakpoint (40rem). */
export const SM_QUERY = "(min-width: 40rem)";

/** Live media query result; `false` on the server and during hydration. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
