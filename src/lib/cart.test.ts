import { describe, expect, it } from "vitest";
import {
  addItem,
  cartTotal,
  cartUnits,
  EMPTY_CART,
  MAX_CART_LINES,
  parseCart,
  reconcileCart,
  removeItem,
  setQuantity,
  type FreshProduct,
} from "./cart";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const C = "33333333-3333-4333-8333-333333333333";

function product(
  id: string,
  overrides: Partial<FreshProduct> = {},
): FreshProduct {
  return {
    id,
    title: `Producto ${id.slice(0, 1)}`,
    brand: "Marca",
    price: 1000,
    stock: 5,
    image: null,
    ...overrides,
  };
}

function uuid(n: number) {
  return `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

describe("addItem", () => {
  it("adds a new product with quantity 1", () => {
    expect(addItem(EMPTY_CART, A, 3)).toEqual({ [A]: 1 });
  });

  it("increments an existing product", () => {
    expect(addItem({ [A]: 1 }, A, 3)).toEqual({ [A]: 2 });
  });

  it("adds several units at once", () => {
    expect(addItem(EMPTY_CART, A, 5, 3)).toEqual({ [A]: 3 });
  });

  it("never exceeds the stock", () => {
    expect(addItem({ [A]: 2 }, A, 2)).toEqual({ [A]: 2 });
    expect(addItem({ [A]: 1 }, A, 3, 10)).toEqual({ [A]: 3 });
  });

  it("returns the same object when nothing changes", () => {
    const items = { [A]: 2 };
    expect(addItem(items, A, 2)).toBe(items);
    expect(addItem(items, B, 0)).toBe(items);
  });

  it("does not mutate the input", () => {
    const items = { [A]: 1 };
    addItem(items, A, 5);
    expect(items).toEqual({ [A]: 1 });
  });

  it("caps the number of distinct products", () => {
    const full = Object.fromEntries(
      Array.from({ length: MAX_CART_LINES }, (_, i) => [uuid(i), 1]),
    );
    expect(addItem(full, A, 5)).toBe(full);
    expect(addItem(full, uuid(0), 5)[uuid(0)]).toBe(2);
  });
});

describe("setQuantity", () => {
  it("sets an exact quantity", () => {
    expect(setQuantity({ [A]: 1 }, A, 3, 5)).toEqual({ [A]: 3 });
  });

  it("clamps to stock", () => {
    expect(setQuantity({ [A]: 1 }, A, 9, 4)).toEqual({ [A]: 4 });
  });

  it("removes the product at 0", () => {
    expect(setQuantity({ [A]: 1, [B]: 2 }, A, 0, 5)).toEqual({ [B]: 2 });
  });
});

describe("removeItem", () => {
  it("removes a product", () => {
    expect(removeItem({ [A]: 1, [B]: 2 }, A)).toEqual({ [B]: 2 });
  });

  it("returns the same object for unknown ids", () => {
    const items = { [A]: 1 };
    expect(removeItem(items, B)).toBe(items);
  });
});

describe("cartUnits", () => {
  it("sums quantities", () => {
    expect(cartUnits({ [A]: 2, [B]: 1, [C]: 1 })).toBe(4);
    expect(cartUnits(EMPTY_CART)).toBe(0);
  });
});

describe("parseCart", () => {
  it("keeps valid entries", () => {
    expect(parseCart({ [A]: 2, [B]: 1 })).toEqual({ [A]: 2, [B]: 1 });
  });

  it("drops invalid ids and quantities", () => {
    expect(
      parseCart({
        [A]: 2,
        "not-a-uuid": 1,
        [B]: 0,
        [C]: 1.5,
        "44444444-4444-4444-8444-444444444444": "3",
      }),
    ).toEqual({ [A]: 2 });
  });

  it("returns an empty cart for non-objects", () => {
    expect(parseCart(null)).toBe(EMPTY_CART);
    expect(parseCart([A])).toBe(EMPTY_CART);
    expect(parseCart("x")).toBe(EMPTY_CART);
  });

  it("limits the number of lines", () => {
    const raw = Object.fromEntries(
      Array.from({ length: MAX_CART_LINES + 10 }, (_, i) => [uuid(i), 1]),
    );
    expect(Object.keys(parseCart(raw))).toHaveLength(MAX_CART_LINES);
  });
});

describe("reconcileCart", () => {
  it("builds lines from fresh data, keeping cart order", () => {
    const result = reconcileCart({ [B]: 1, [A]: 2 }, [
      product(A, { price: 38000 }),
      product(B, { price: 42000 }),
    ]);
    expect(result.lines.map((l) => [l.id, l.quantity, l.price])).toEqual([
      [B, 1, 42000],
      [A, 2, 38000],
    ]);
    expect(result.notices).toEqual([]);
  });

  it("uses fresh prices and titles, not stored ones", () => {
    const result = reconcileCart({ [A]: 1 }, [
      product(A, { title: "Nuevo título", price: 999 }),
    ]);
    expect(result.lines[0]).toMatchObject({
      title: "Nuevo título",
      price: 999,
    });
  });

  it("removes products that no longer exist", () => {
    const result = reconcileCart({ [A]: 1, [B]: 1 }, [product(A)]);
    expect(result.items).toEqual({ [A]: 1 });
    expect(result.notices).toEqual([{ kind: "removed", title: null }]);
  });

  it("removes products without stock", () => {
    const result = reconcileCart({ [A]: 1 }, [
      product(A, { title: "Fuente", stock: 0 }),
    ]);
    expect(result.items).toEqual({});
    expect(result.lines).toEqual([]);
    expect(result.notices).toEqual([{ kind: "removed", title: "Fuente" }]);
  });

  it("clamps quantities to the current stock", () => {
    const result = reconcileCart({ [A]: 3 }, [
      product(A, { title: "RAM", stock: 1 }),
    ]);
    expect(result.items).toEqual({ [A]: 1 });
    expect(result.lines[0]?.quantity).toBe(1);
    expect(result.notices).toEqual([
      { kind: "adjusted", title: "RAM", quantity: 1 },
    ]);
  });

  it("returns the same items object when nothing changed", () => {
    const items = { [A]: 1 };
    expect(reconcileCart(items, [product(A)]).items).toBe(items);
  });
});

describe("cartTotal", () => {
  it("sums price × quantity", () => {
    expect(
      cartTotal([
        { price: 38000, quantity: 2 },
        { price: 42000, quantity: 1 },
        { price: 95000, quantity: 1 },
      ]),
    ).toBe(213000);
  });
});
