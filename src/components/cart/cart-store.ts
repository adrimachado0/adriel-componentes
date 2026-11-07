"use client";

import { useSyncExternalStore } from "react";
import { cartUnits, EMPTY_CART, parseCart, type CartItems } from "@/lib/cart";

// Versioned key: bump it if the stored shape ever changes.
const STORAGE_KEY = "adriel-cart:v1";

let items: CartItems = EMPTY_CART;
let loaded = false;
const listeners = new Set<() => void>();

function read(): CartItems {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? parseCart(JSON.parse(raw)) : EMPTY_CART;
  } catch {
    return EMPTY_CART;
  }
}

function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  items = read();
  // Keep tabs in sync.
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    items = read();
    emit();
  });
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  ensureLoaded();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): CartItems {
  ensureLoaded();
  return items;
}

// The server (and the hydration pass) always see an empty cart, so the HTML
// matches; the stored cart appears right after hydration.
function getServerSnapshot(): CartItems {
  return EMPTY_CART;
}

export function useCartItems(): CartItems {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Quantity of one product; re-renders only when that number changes. */
export function useCartQuantity(productId: string): number {
  return useSyncExternalStore(
    subscribe,
    () => getSnapshot()[productId] ?? 0,
    () => 0,
  );
}

/** Total units (header badge). */
export function useCartUnits(): number {
  return useSyncExternalStore(
    subscribe,
    () => cartUnits(getSnapshot()),
    () => 0,
  );
}

/** Current cart outside React (event handlers). */
export function getCartItems(): CartItems {
  return getSnapshot();
}

/** Applies a pure update (see src/lib/cart.ts) and persists it. */
export function updateCart(update: (current: CartItems) => CartItems) {
  const next = update(getSnapshot());
  if (next === items) return;
  items = next;
  try {
    if (Object.keys(next).length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    // Storage full or blocked (private mode): the cart still works in memory.
  }
  emit();
}
