"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function focusables(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => el.getClientRects().length > 0,
  );
}

type UseModalOptions = {
  open: boolean;
  containerRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  /** Element to focus on open (defaults to the first focusable). */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Where focus goes on close if the opener is gone (e.g. a toast). */
  fallbackFocusRef?: RefObject<HTMLElement | null>;
};

/**
 * Modal dialog behavior: traps Tab inside the container, closes on Escape,
 * locks background scroll and returns focus to the opener on close.
 */
export function useModal({
  open,
  containerRef,
  onClose,
  initialFocusRef,
  fallbackFocusRef,
}: UseModalOptions) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const fallback = fallbackFocusRef?.current ?? null;

    // Scroll lock (compensating the scrollbar width to avoid layout shift).
    const html = document.documentElement;
    const scrollbar = window.innerWidth - html.clientWidth;
    const previousOverflow = html.style.overflow;
    const previousPadding = html.style.paddingRight;
    html.style.overflow = "hidden";
    if (scrollbar > 0) html.style.paddingRight = `${scrollbar}px`;

    const frame = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;
      (
        initialFocusRef?.current ??
        focusables(container)[0] ??
        container
      ).focus();
    });

    function onKeyDown(event: KeyboardEvent) {
      const container = containerRef.current;
      if (!container) return;
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables(container);
      const first = items[0];
      const last = items.at(-1);
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !container.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (active === last || !container.contains(active))
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      html.style.overflow = previousOverflow;
      html.style.paddingRight = previousPadding;
      const target = opener && opener.isConnected ? opener : fallback;
      target?.focus();
    };
  }, [open, containerRef, initialFocusRef, fallbackFocusRef]);
}
