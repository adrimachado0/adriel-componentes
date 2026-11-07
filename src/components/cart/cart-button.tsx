"use client";

import { ShoppingCart } from "lucide-react";

// Stage 3 placeholder: the cart (count badge + panel) is wired in stage 4.
export function CartButton() {
  return (
    <button
      type="button"
      aria-label="Abrir carrito"
      className="relative flex size-11 items-center justify-center rounded-full border border-line-strong bg-surface text-ink"
    >
      <ShoppingCart className="size-5" strokeWidth={1.8} aria-hidden />
    </button>
  );
}
