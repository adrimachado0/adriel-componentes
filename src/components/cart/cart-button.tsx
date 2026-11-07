"use client";

import { m } from "motion/react";
import { ShoppingCart } from "lucide-react";
import { useCartActions, useCartUi } from "./cart-provider";
import { useCartUnits } from "./cart-store";

export function CartButton() {
  const { openCart, cartButtonRef } = useCartActions();
  const { isOpen } = useCartUi();
  const units = useCartUnits();

  return (
    <button
      ref={cartButtonRef}
      type="button"
      aria-label={units > 0 ? `Abrir carrito (${units})` : "Abrir carrito"}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      onClick={openCart}
      className="relative flex size-11 items-center justify-center rounded-full border border-line-strong bg-surface text-ink transition-colors hover:border-primary hover:text-primary"
    >
      <ShoppingCart className="size-5" strokeWidth={1.8} aria-hidden />
      {units > 0 ? (
        // key={units}: remounts on every change, so the "pop" replays.
        <m.span
          key={units}
          aria-hidden
          initial={{ scale: 0.6 }}
          animate={{ scale: [0.6, 1.2, 1] }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-surface bg-primary px-[5px] text-[11px] font-extrabold text-white"
        >
          {units}
        </m.span>
      ) : null}
    </button>
  );
}
