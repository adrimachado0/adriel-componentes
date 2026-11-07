"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { useCartActions } from "@/components/cart/cart-provider";
import { useCartQuantity } from "@/components/cart/cart-store";
import { track, whatsappEvent } from "@/lib/analytics";
import {
  formatAvailability,
  formatPrice,
  formatStockLabel,
} from "@/lib/format";

type ProductPurchaseProps = {
  productId: string;
  /** For analytics. */
  title: string;
  brand: string;
  price: number;
  stock: number;
  /** Prebuilt wa.me link with the product message. */
  whatsappHref: string;
};

/**
 * Quantity selector + "Agregar al carrito" + "Preguntar por WhatsApp".
 * On mobile the buttons live in a fixed bottom bar that shares the quantity.
 */
export function ProductPurchase({
  productId,
  title,
  brand,
  price,
  stock,
  whatsappHref,
}: ProductPurchaseProps) {
  const { addToCart, openCart } = useCartActions();
  const inCart = useCartQuantity(productId);
  const available = Math.max(stock - inCart, 0);
  const [selected, setSelected] = useState(1);
  const quantity = Math.min(selected, Math.max(available, 1));

  const askEvent = whatsappEvent("detalle", { producto: title });
  const soldOut = stock < 1;
  const allInCart = !soldOut && available < 1;

  function add() {
    addToCart(productId, stock, { amount: quantity });
    track("agregar-carrito", {
      producto: title,
      marca: brand || "Sin marca",
      origen: "detalle",
    });
    setSelected(1);
  }

  const mainAction = soldOut ? (
    <button
      type="button"
      disabled
      className="flex h-12 w-full items-center justify-center rounded-full bg-line-chip text-sm font-bold text-muted sm:h-[54px] sm:text-[15px]"
    >
      Vendido
    </button>
  ) : allInCart ? (
    <button
      type="button"
      onClick={openCart}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-primary bg-surface text-sm font-bold whitespace-nowrap text-primary sm:h-[54px] sm:gap-2.5 sm:text-[15px]"
    >
      <ShoppingCart
        className="size-[18px] sm:size-[19px]"
        strokeWidth={2}
        aria-hidden
      />
      Ya está en tu carrito
    </button>
  ) : (
    <button
      type="button"
      onClick={add}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold whitespace-nowrap text-white shadow-primary transition-colors hover:bg-primary-hover sm:h-[54px] sm:gap-2.5 sm:text-[15px]"
    >
      <ShoppingCart
        className="size-[18px] sm:size-[19px]"
        strokeWidth={2}
        aria-hidden
      />
      Agregar al carrito
    </button>
  );

  return (
    <>
      <div className="flex flex-col gap-3">
        {soldOut ? null : (
          <div className="flex items-center justify-between gap-3 sm:flex-wrap sm:justify-start sm:gap-x-3.5 sm:gap-y-2.5">
            <div className="flex flex-col gap-0.5 sm:contents">
              <span id="qty-label" className="text-sm font-bold">
                Cantidad
              </span>
              <span className="text-[13px] text-muted sm:order-last">
                de {formatAvailability(stock)}
                {inCart > 0 ? ` · ${inCart} en tu carrito` : ""}
              </span>
            </div>
            <div
              role="group"
              aria-labelledby="qty-label"
              className="flex h-12 items-center rounded-full border border-line-strong bg-surface px-0.5"
            >
              <button
                type="button"
                aria-label="Restar uno"
                disabled={quantity <= 1}
                onClick={() => setSelected(quantity - 1)}
                className="flex size-11 items-center justify-center rounded-full disabled:opacity-35"
              >
                <Minus className="size-4" strokeWidth={2.4} aria-hidden />
              </button>
              <span
                aria-live="polite"
                className="min-w-[26px] text-center text-base font-extrabold tabular-nums sm:min-w-7"
              >
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Sumar uno"
                disabled={quantity >= available}
                onClick={() => setSelected(quantity + 1)}
                className="flex size-11 items-center justify-center rounded-full disabled:opacity-35"
              >
                <Plus className="size-4" strokeWidth={2.4} aria-hidden />
              </button>
            </div>
          </div>
        )}

        <div className="hidden flex-col gap-3 sm:flex">
          {mainAction}
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            {...askEvent}
            className="flex h-[54px] items-center justify-center gap-2.5 rounded-full border-[1.5px] border-whatsapp bg-surface text-[15px] font-bold text-whatsapp transition-colors hover:bg-whatsapp-tint"
          >
            <WhatsAppIcon className="size-5" />
            Preguntar por WhatsApp
          </a>
        </div>
      </div>

      {/* Mobile bottom bar (the floating WhatsApp button moves above it, see globals.css). */}
      <div
        data-bottom-bar
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/96 shadow-bar sm:hidden"
      >
        <div className="flex items-center gap-2.5 px-4 pt-3 pb-[max(14px,env(safe-area-inset-bottom))]">
          <div className="mr-0.5 flex shrink-0 flex-col gap-px">
            <span className="text-lg font-extrabold tracking-[-0.02em] tabular-nums">
              {formatPrice(price)}
            </span>
            <span className="text-xs text-muted">
              {formatStockLabel(stock)}
            </span>
          </div>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Preguntar por WhatsApp"
            {...askEvent}
            className="flex size-12 shrink-0 items-center justify-center rounded-full border-[1.5px] border-whatsapp bg-surface text-whatsapp"
          >
            <WhatsAppIcon className="size-[21px]" />
          </a>
          <div className="min-w-0 flex-1">{mainAction}</div>
        </div>
      </div>
    </>
  );
}
