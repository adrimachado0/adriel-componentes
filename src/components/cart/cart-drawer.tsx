"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  CircleAlert,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { ImagePlaceholderIcon, WhatsAppIcon } from "@/components/icons";
import { getCartProducts } from "@/lib/actions/cart";
import {
  cartTotal,
  cartUnits,
  EMPTY_CART,
  lineTotal,
  reconcileCart,
  removeItem,
  setQuantity,
  type CartLine,
  type CartNotice,
  type FreshProduct,
} from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { SM_QUERY, useMediaQuery } from "@/lib/hooks/use-media-query";
import { useModal } from "@/lib/hooks/use-modal";
import { contact, productImageUrl } from "@/lib/site";
import { cartMessage, whatsappUrl } from "@/lib/whatsapp";
import { useCartActions, useCartUi } from "./cart-provider";
import { getCartItems, updateCart, useCartItems } from "./cart-store";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export function CartDrawer() {
  const { isOpen } = useCartUi();
  return (
    <AnimatePresence>
      {isOpen ? <CartDialog key="cart" /> : null}
    </AnimatePresence>
  );
}

type FreshState =
  | { status: "loading"; products: FreshProduct[] }
  | { status: "ready"; products: FreshProduct[] }
  | { status: "error"; products: FreshProduct[] };

function CartDialog() {
  const { closeCart, cartButtonRef } = useCartActions();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useModal({
    open: true,
    containerRef: panelRef,
    onClose: closeCart,
    initialFocusRef: closeRef,
    fallbackFocusRef: cartButtonRef,
  });

  const isDesktop = useMediaQuery(SM_QUERY);
  const reduceMotion = useReducedMotion();

  const items = useCartItems();
  const [fresh, setFresh] = useState<FreshState>(() => ({
    status: Object.keys(getCartItems()).length > 0 ? "loading" : "ready",
    products: [],
  }));
  const [notices, setNotices] = useState<CartNotice[]>([]);
  const [attempt, setAttempt] = useState(0);

  // Prices, stock and titles always come fresh from the DB when the cart opens.
  useEffect(() => {
    const ids = Object.keys(getCartItems());
    if (ids.length === 0) return;
    let cancelled = false;
    getCartProducts(ids).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setFresh({ status: "error", products: [] });
        return;
      }
      const reconciled = reconcileCart(getCartItems(), result.products);
      if (reconciled.items !== getCartItems()) {
        updateCart(() => reconciled.items);
      }
      setNotices(reconciled.notices);
      setFresh({ status: "ready", products: result.products });
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const productsById = useMemo(
    () => new Map(fresh.products.map((p) => [p.id, p])),
    [fresh.products],
  );
  const lines: CartLine[] = [];
  for (const [id, quantity] of Object.entries(items)) {
    const product = productsById.get(id);
    if (product && product.stock > 0) {
      lines.push({ ...product, quantity: Math.min(quantity, product.stock) });
    }
  }

  const isEmpty =
    Object.keys(items).length === 0 ||
    (fresh.status === "ready" && lines.length === 0);
  const units =
    fresh.status === "ready"
      ? lines.reduce((sum, line) => sum + line.quantity, 0)
      : cartUnits(items);

  const hidden = reduceMotion
    ? { opacity: 0 }
    : isDesktop
      ? { x: "100%" }
      : { y: "100%" };
  const shown = reduceMotion ? { opacity: 1 } : { x: 0, y: 0 };

  return (
    <>
      <m.div
        aria-hidden
        className="fixed inset-0 z-40 bg-overlay sm:backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: EASE_OUT }}
        onClick={closeCart}
      />
      <m.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        tabIndex={-1}
        className="fixed inset-x-0 top-12 bottom-0 z-50 flex flex-col overflow-hidden rounded-t-sheet bg-sheet shadow-sheet-bottom outline-none sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[440px] sm:max-w-full sm:rounded-t-none sm:rounded-l-sheet sm:shadow-sheet-side"
        initial={hidden}
        animate={shown}
        exit={{ ...hidden, transition: { duration: 0.2, ease: EASE_OUT } }}
        transition={{ duration: 0.28, ease: EASE_OUT }}
      >
        <div aria-hidden className="flex justify-center pt-2.5 sm:hidden">
          <span className="h-[5px] w-10 rounded-full bg-handle" />
        </div>

        <div className="flex items-center justify-between gap-3 pt-1.5 pr-3 pb-2.5 pl-5 sm:pt-[18px] sm:pr-4 sm:pb-3.5 sm:pl-6">
          <div className="flex items-center gap-2.5">
            <h2
              id="cart-title"
              className="text-[21px] font-extrabold tracking-[-0.02em] sm:text-[22px]"
            >
              Tu carrito
            </h2>
            {units > 0 ? (
              <span className="flex h-[26px] min-w-[26px] items-center justify-center rounded-full bg-primary-tint-strong px-2 text-[13px] font-extrabold text-primary">
                <span className="sr-only">Unidades: </span>
                {units}
              </span>
            ) : null}
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="Cerrar carrito"
            onClick={closeCart}
            className="flex size-11 items-center justify-center rounded-full border border-line-strong bg-surface text-ink"
          >
            <X className="size-[18px]" strokeWidth={2} aria-hidden />
          </button>
        </div>

        {isEmpty ? (
          <EmptyCart onContinue={closeCart} />
        ) : (
          <>
            <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-3 pt-0.5 pb-3 sm:px-4 sm:pt-1 sm:pb-4">
              {notices.length > 0 ? <CartNotices notices={notices} /> : null}

              {fresh.status === "error" ? (
                <div
                  role="alert"
                  className="flex flex-col items-start gap-2 rounded-[18px] border border-danger-border bg-danger-bg p-4 text-danger-text"
                >
                  <p className="text-sm font-bold">
                    No se pudieron actualizar los precios
                  </p>
                  <p className="text-[13px] leading-[1.45]">
                    Revisá tu conexión e intentá de nuevo.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFresh({ status: "loading", products: [] });
                      setAttempt((n) => n + 1);
                    }}
                    className="mt-1 h-11 rounded-full bg-surface px-4 text-sm font-bold text-ink"
                  >
                    Reintentar
                  </button>
                </div>
              ) : null}

              {fresh.status === "loading" ? (
                <div aria-busy="true" className="flex flex-col gap-2.5">
                  <span className="sr-only" role="status">
                    Actualizando precios y stock…
                  </span>
                  {Array.from(
                    { length: Math.min(Object.keys(items).length, 3) },
                    (_, i) => (
                      <CartLineSkeleton key={i} />
                    ),
                  )}
                </div>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  <AnimatePresence initial={false} mode="popLayout">
                    {lines.map((line) => (
                      <m.li
                        key={line.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{
                          opacity: 0,
                          x: 32,
                          transition: { duration: 0.18, ease: EASE_OUT },
                        }}
                        transition={{ duration: 0.22, ease: EASE_OUT }}
                      >
                        <CartLineItem line={line} />
                      </m.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {fresh.status === "ready" ? (
              <CartSummary lines={lines} units={units} />
            ) : null}
          </>
        )}
      </m.div>
    </>
  );
}

function CartLineItem({ line }: { line: CartLine }) {
  const atMax = line.quantity >= line.stock;
  return (
    <div className="flex gap-3 rounded-card-sm border border-line bg-surface p-2.5 sm:rounded-[20px] sm:p-3">
      <span className="relative size-[72px] shrink-0 overflow-hidden rounded-photo-sm bg-photo sm:size-20 sm:rounded-field">
        {line.image ? (
          <Image
            src={productImageUrl(line.image)}
            alt=""
            fill
            sizes="80px"
            className="object-contain"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-primary">
            <ImagePlaceholderIcon className="size-[30px]" />
          </span>
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-start gap-1">
          <span className="line-clamp-2 min-w-0 flex-1 pt-0.5 text-sm leading-[1.3] font-bold sm:leading-[1.35]">
            {line.title}
          </span>
          <button
            type="button"
            aria-label={`Quitar ${line.title} del carrito`}
            onClick={() => updateCart((items) => removeItem(items, line.id))}
            className="-mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-danger-strong"
          >
            <Trash2 className="size-[18px]" strokeWidth={1.8} aria-hidden />
          </button>
        </div>
        <span className="text-xs text-muted sm:text-[13px]">
          {line.brand ? `${line.brand} · ` : ""}
          {formatPrice(line.price)} c/u
        </span>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1.5 sm:pt-2">
          <span className="text-[15px] font-extrabold text-primary tabular-nums sm:text-base">
            {formatPrice(lineTotal(line))}
          </span>
          <div
            role="group"
            aria-label={`Cantidad de ${line.title}`}
            className="flex h-11 items-center rounded-full bg-primary-tint text-primary"
          >
            <button
              type="button"
              aria-label="Quitar uno"
              onClick={() =>
                updateCart((items) =>
                  setQuantity(items, line.id, line.quantity - 1, line.stock),
                )
              }
              className="flex h-11 w-10 items-center justify-center rounded-full"
            >
              <Minus className="size-3.5" strokeWidth={2.6} aria-hidden />
            </button>
            <span
              aria-live="polite"
              className="min-w-4 text-center text-sm font-extrabold tabular-nums sm:min-w-[18px]"
            >
              {line.quantity}
            </span>
            <button
              type="button"
              aria-label="Agregar uno"
              disabled={atMax}
              onClick={() =>
                updateCart((items) =>
                  setQuantity(items, line.id, line.quantity + 1, line.stock),
                )
              }
              className="flex h-11 w-10 items-center justify-center rounded-full disabled:opacity-35"
            >
              <Plus className="size-3.5" strokeWidth={2.6} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartSummary({ lines, units }: { lines: CartLine[]; units: number }) {
  const href = whatsappUrl(contact.whatsappNumber, cartMessage(lines));
  return (
    <div className="flex flex-col gap-2.5 border-t border-line bg-surface px-5 pt-4 pb-5 sm:px-6 sm:pt-5 sm:pb-6">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted">Componentes</span>
        <span className="font-bold">{units}</span>
      </div>
      <div className="flex items-baseline justify-between gap-3 border-t border-dashed border-line-chip pt-2.5">
        <span className="text-base font-extrabold">Total estimado</span>
        <span className="text-2xl font-extrabold tracking-[-0.02em] tabular-nums sm:text-[26px]">
          {formatPrice(cartTotal(lines))}
        </span>
      </div>
      <p className="text-[13px] leading-[1.45] text-muted sm:leading-normal">
        Precio y disponibilidad se confirman por WhatsApp.
        <span className="hidden sm:inline">
          {" "}
          Tu carrito queda guardado en este navegador.
        </span>
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-0.5 flex h-[54px] items-center justify-center gap-2.5 rounded-full bg-whatsapp text-[15px] font-bold text-white shadow-whatsapp sm:mt-1"
      >
        <WhatsAppIcon className="size-5" />
        <span>Preguntar por WhatsApp</span>
        <ArrowRight
          className="hidden size-[18px] sm:block"
          strokeWidth={2}
          aria-hidden
        />
      </a>
      <button
        type="button"
        onClick={() => updateCart(() => EMPTY_CART)}
        className="h-11 rounded-full text-sm font-semibold text-muted transition-colors hover:text-ink"
      >
        Vaciar carrito
      </button>
    </div>
  );
}

function CartNotices({ notices }: { notices: CartNotice[] }) {
  return (
    <div
      role="status"
      className="flex gap-2.5 rounded-[18px] bg-warning-bg p-3.5 text-warning"
    >
      <CircleAlert
        className="mt-px size-[18px] shrink-0"
        strokeWidth={2}
        aria-hidden
      />
      <ul className="flex flex-col gap-1 text-[13px] leading-[1.45] font-semibold">
        {notices.map((notice, i) => (
          <li key={i}>{noticeText(notice)}</li>
        ))}
      </ul>
    </div>
  );
}

function noticeText(notice: CartNotice): string {
  if (notice.kind === "removed") {
    return notice.title
      ? `“${notice.title}” ya no está disponible y se quitó del carrito.`
      : "Se quitó del carrito un componente que ya no está disponible.";
  }
  const units =
    notice.quantity === 1 ? "1 unidad" : `${notice.quantity} unidades`;
  return `De “${notice.title}” solo queda${notice.quantity === 1 ? "" : "n"} ${units}: se ajustó la cantidad.`;
}

function EmptyCart({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2.5 px-6 pb-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-primary-tint text-primary">
        <ShoppingCart className="size-7" strokeWidth={1.8} aria-hidden />
      </span>
      <p className="text-[17px] font-extrabold">Tu carrito está vacío</p>
      <p className="max-w-[300px] text-sm leading-normal text-muted">
        Agregá los componentes que te interesen y consultame por todos juntos
        por WhatsApp.
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="mt-1.5 flex h-[46px] items-center rounded-full bg-primary px-[22px] text-sm font-bold text-white shadow-primary transition-colors hover:bg-primary-hover"
      >
        Seguir viendo
      </button>
    </div>
  );
}

function CartLineSkeleton() {
  return (
    <div className="flex gap-3 rounded-card-sm border border-line bg-surface p-2.5 sm:rounded-[20px] sm:p-3">
      <span className="size-[72px] shrink-0 skeleton rounded-photo-sm sm:size-20 sm:rounded-field" />
      <div className="flex flex-1 flex-col gap-2 pt-1">
        <span className="h-3.5 w-11/12 skeleton rounded-full" />
        <span className="h-3 w-1/2 skeleton rounded-full" />
        <span className="mt-auto h-9 w-28 skeleton self-end rounded-full" />
      </div>
    </div>
  );
}
