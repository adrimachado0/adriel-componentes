"use client";

import { Minus, Plus, ShoppingCart } from "lucide-react";
import { setQuantity } from "@/lib/cart";
import { useCartActions } from "./cart-provider";
import { updateCart, useCartQuantity } from "./cart-store";

type CardCartControlProps = {
  productId: string;
  stock: number;
};

/** "Agregar al carrito", which becomes "− cantidad +" (capped at stock) once in the cart. */
export function CardCartControl({ productId, stock }: CardCartControlProps) {
  const { addToCart } = useCartActions();
  const quantity = useCartQuantity(productId);

  if (quantity === 0) {
    return (
      <button
        type="button"
        onClick={() => addToCart(productId, stock)}
        className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-primary text-[13px] font-bold text-white shadow-primary-sm transition-colors hover:bg-primary-hover sm:gap-2 sm:text-sm"
      >
        <Plus className="size-4 sm:hidden" strokeWidth={2.2} aria-hidden />
        <ShoppingCart
          className="hidden size-[18px] sm:block"
          strokeWidth={2}
          aria-hidden
        />
        <span className="sm:hidden">Agregar</span>
        <span className="hidden sm:inline">Agregar al carrito</span>
      </button>
    );
  }

  const atMax = quantity >= stock;
  const change = (next: number) =>
    updateCart((items) => setQuantity(items, productId, next, stock));

  return (
    <div
      role="group"
      aria-label="Cantidad en el carrito"
      className="flex h-11 items-center justify-between rounded-full bg-primary-tint text-primary"
    >
      <button
        type="button"
        aria-label="Quitar uno"
        onClick={() => change(quantity - 1)}
        className="flex size-11 items-center justify-center rounded-full"
      >
        <Minus className="size-4" strokeWidth={2.4} aria-hidden />
      </button>
      <span
        aria-live="polite"
        className="text-sm font-extrabold whitespace-nowrap tabular-nums sm:text-[13px] sm:font-bold"
      >
        {quantity}
        <span className="hidden sm:inline"> en el carrito</span>
      </span>
      <button
        type="button"
        aria-label="Agregar uno"
        disabled={atMax}
        onClick={() => change(quantity + 1)}
        className="flex size-11 items-center justify-center rounded-full disabled:opacity-35"
      >
        <Plus className="size-4" strokeWidth={2.4} aria-hidden />
      </button>
    </div>
  );
}
