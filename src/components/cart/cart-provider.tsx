"use client";

import {
  createContext,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { addItem } from "@/lib/cart";
import { updateCart } from "./cart-store";
import { CartDrawer } from "./cart-drawer";
import { AddedToast } from "./added-toast";

type CartActions = {
  openCart: () => void;
  closeCart: () => void;
  /** Adds units (capped at stock) and optionally shows the "Agregado" toast. */
  addToCart: (
    productId: string,
    stock: number,
    options?: { amount?: number; notify?: boolean },
  ) => void;
  dismissToast: () => void;
  /** Header button: focus target when the cart closes and the opener is gone. */
  cartButtonRef: RefObject<HTMLButtonElement | null>;
};

type CartUi = {
  isOpen: boolean;
  /** 0 = hidden; each "added" event gets a new id (restarts the timer). */
  toastId: number;
};

// Two contexts: actions never change, so buttons that only add/open don't
// re-render when the panel opens or the toast shows.
const ActionsContext = createContext<CartActions | null>(null);
const UiContext = createContext<CartUi | null>(null);

export function useCartActions(): CartActions {
  const value = use(ActionsContext);
  if (!value)
    throw new Error("useCartActions must be used inside <CartProvider>");
  return value;
}

export function useCartUi(): CartUi {
  const value = use(UiContext);
  if (!value) throw new Error("useCartUi must be used inside <CartProvider>");
  return value;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [toastId, setToastId] = useState(0);
  const cartButtonRef = useRef<HTMLButtonElement>(null);

  const actions = useMemo<CartActions>(
    () => ({
      openCart: () => {
        setToastId(0);
        setIsOpen(true);
      },
      closeCart: () => setIsOpen(false),
      dismissToast: () => setToastId(0),
      addToCart: (productId, stock, { amount = 1, notify = true } = {}) => {
        updateCart((items) => addItem(items, productId, stock, amount));
        if (notify) setToastId((id) => id + 1);
      },
      cartButtonRef,
    }),
    [],
  );

  const ui = useMemo(() => ({ isOpen, toastId }), [isOpen, toastId]);

  // Lets CSS hide the floating WhatsApp button while the cart is open.
  useEffect(() => {
    document.documentElement.toggleAttribute("data-cart-open", isOpen);
  }, [isOpen]);

  return (
    <ActionsContext value={actions}>
      <UiContext value={ui}>
        {children}
        <CartDrawer />
        <AddedToast />
      </UiContext>
    </ActionsContext>
  );
}
