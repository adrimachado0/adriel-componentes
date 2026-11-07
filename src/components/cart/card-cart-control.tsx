"use client";

import { Plus, ShoppingCart } from "lucide-react";

type CardCartControlProps = {
  productId: string;
  stock: number;
};

// Stage 3 placeholder: "Agregar al carrito" ⇄ "− cantidad +" is wired in stage 4.
export function CardCartControl({ productId, stock }: CardCartControlProps) {
  return (
    <button
      type="button"
      data-product-id={productId}
      disabled={stock < 1}
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
