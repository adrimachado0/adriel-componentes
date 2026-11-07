// Pure cart logic (no React, no storage) so it can be unit-tested.
// The cart only stores { [productId]: quantity }; titles, prices and stock are
// always taken fresh from the database (see reconcileCart).

export type CartItems = Readonly<Record<string, number>>;

export const EMPTY_CART: CartItems = Object.freeze({});

/** Hard cap on distinct products, to keep storage and server queries bounded. */
export const MAX_CART_LINES = 50;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isProductId(value: string): boolean {
  return UUID_RE.test(value);
}

/** Validates untrusted data (e.g. from localStorage) into a clean cart. */
export function parseCart(raw: unknown): CartItems {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return EMPTY_CART;
  }
  const items: Record<string, number> = {};
  let lines = 0;
  for (const [id, qty] of Object.entries(raw)) {
    if (lines >= MAX_CART_LINES) break;
    if (!isProductId(id)) continue;
    if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 1) continue;
    items[id] = qty;
    lines++;
  }
  return items;
}

/** Adds `amount` units, never exceeding `stock`. */
export function addItem(
  items: CartItems,
  id: string,
  stock: number,
  amount = 1,
): CartItems {
  if (stock < 1 || amount < 1) return items;
  const current = items[id] ?? 0;
  if (current === 0 && Object.keys(items).length >= MAX_CART_LINES) {
    return items;
  }
  const next = Math.min(current + amount, stock);
  if (next === current) return items;
  return { ...items, [id]: next };
}

/** Sets an exact quantity (clamped to stock). 0 or less removes the item. */
export function setQuantity(
  items: CartItems,
  id: string,
  quantity: number,
  stock: number,
): CartItems {
  const next = Math.min(Math.floor(quantity), stock);
  if (next < 1) return removeItem(items, id);
  if (items[id] === next) return items;
  if (items[id] === undefined && Object.keys(items).length >= MAX_CART_LINES) {
    return items;
  }
  return { ...items, [id]: next };
}

export function removeItem(items: CartItems, id: string): CartItems {
  if (!(id in items)) return items;
  const next: Record<string, number> = { ...items };
  delete next[id];
  return next;
}

/** Total units (what the header badge shows). */
export function cartUnits(items: CartItems): number {
  let total = 0;
  for (const qty of Object.values(items)) total += qty;
  return total;
}

// ---------------------------------------------------------------------------
// Reconciliation with fresh data
// ---------------------------------------------------------------------------

export type FreshProduct = {
  id: string;
  title: string;
  brand: string;
  price: number;
  stock: number;
  image: string | null;
};

export type CartLine = FreshProduct & { quantity: number };

export type CartNotice =
  | { kind: "removed"; title: string | null }
  | { kind: "adjusted"; title: string; quantity: number };

export type ReconcileResult = {
  items: CartItems;
  lines: CartLine[];
  notices: CartNotice[];
};

/**
 * Applies fresh product data to the stored cart:
 * - products that no longer exist or have no stock are removed (with a notice),
 * - quantities above the current stock are clamped (with a notice).
 * Lines keep the order in which they were added to the cart.
 */
export function reconcileCart(
  items: CartItems,
  fresh: readonly FreshProduct[],
): ReconcileResult {
  const byId = new Map(fresh.map((p) => [p.id, p]));
  const nextItems: Record<string, number> = {};
  const lines: CartLine[] = [];
  const notices: CartNotice[] = [];

  for (const [id, quantity] of Object.entries(items)) {
    const product = byId.get(id);
    if (!product || product.stock < 1) {
      notices.push({ kind: "removed", title: product?.title ?? null });
      continue;
    }
    const clamped = Math.min(quantity, product.stock);
    if (clamped < quantity) {
      notices.push({
        kind: "adjusted",
        title: product.title,
        quantity: clamped,
      });
    }
    nextItems[id] = clamped;
    lines.push({ ...product, quantity: clamped });
  }

  return {
    items: notices.length > 0 ? nextItems : items,
    lines,
    notices,
  };
}

export function lineTotal(line: Pick<CartLine, "price" | "quantity">): number {
  return line.price * line.quantity;
}

export function cartTotal(
  lines: readonly Pick<CartLine, "price" | "quantity">[],
): number {
  let total = 0;
  for (const line of lines) total += lineTotal(line);
  return total;
}
