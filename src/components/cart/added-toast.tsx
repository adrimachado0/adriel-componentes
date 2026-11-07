"use client";

import { useEffect } from "react";
import { AnimatePresence, m } from "motion/react";
import { Check } from "lucide-react";
import { useCartActions, useCartUi } from "./cart-provider";

const VISIBLE_MS = 4000;

/** Small "Agregado al carrito" notice that slides up from the bottom. */
export function AddedToast() {
  const { toastId } = useCartUi();
  const { openCart, dismissToast } = useCartActions();

  useEffect(() => {
    if (!toastId) return;
    const timer = window.setTimeout(dismissToast, VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [toastId, dismissToast]);

  return (
    // The live region is always mounted so screen readers announce the change.
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(84px+var(--bottom-bar-h))] z-50 flex justify-center px-4 sm:bottom-6 sm:px-24"
    >
      <AnimatePresence>
        {toastId ? (
          <m.div
            key="toast"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16, transition: { duration: 0.15 } }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto flex w-full items-center gap-3 rounded-card-sm bg-ink py-2 pr-2 pl-3 text-white shadow-dialog sm:w-auto"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-bg text-success">
              <Check className="size-4" strokeWidth={2.6} aria-hidden />
            </span>
            <span className="flex-1 text-sm font-bold whitespace-nowrap">
              Agregado al carrito
            </span>
            <button
              type="button"
              onClick={openCart}
              className="h-11 shrink-0 rounded-full bg-primary px-4 text-sm font-bold whitespace-nowrap transition-colors hover:bg-primary-hover"
            >
              Ver carrito
            </button>
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
