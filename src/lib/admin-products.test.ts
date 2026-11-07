import { describe, expect, it } from "vitest";
import {
  filterAdminProducts,
  formatAdminSummary,
  formatPhotoCount,
  parseStatusFilter,
} from "./admin-products";

const products = [
  { title: "Memoria RAM Fury Beast 16 GB", brand: "Kingston", stock: 2 },
  { title: "Disco rígido Barracuda 1 TB", brand: "Seagate", stock: 4 },
  { title: "Fuente 500 W 80 Plus White", brand: "EVGA", stock: 0 },
  { title: "Fuente CX650M 650 W", brand: "Corsair", stock: 1 },
];

describe("filterAdminProducts", () => {
  it("returns everything with counts per status", () => {
    const { visible, counts } = filterAdminProducts(products, {
      query: "",
      status: "todos",
    });
    expect(visible).toHaveLength(4);
    expect(counts).toEqual({ todos: 4, "en-venta": 3, "sin-stock": 1 });
  });

  it("searches title and brand, ignoring case and accents", () => {
    expect(
      filterAdminProducts(products, { query: "RIGIDO", status: "todos" })
        .visible,
    ).toEqual([products[1]]);
    expect(
      filterAdminProducts(products, { query: "corsair", status: "todos" })
        .visible,
    ).toEqual([products[3]]);
  });

  it("counts after searching and filters by tab", () => {
    const { visible, counts } = filterAdminProducts(products, {
      query: "fuente",
      status: "sin-stock",
    });
    expect(counts).toEqual({ todos: 2, "en-venta": 1, "sin-stock": 1 });
    expect(visible).toEqual([products[2]]);
  });
});

describe("parseStatusFilter", () => {
  it("accepts known values and defaults to todos", () => {
    expect(parseStatusFilter("en-venta")).toBe("en-venta");
    expect(parseStatusFilter("sin-stock")).toBe("sin-stock");
    expect(parseStatusFilter("otro")).toBe("todos");
    expect(parseStatusFilter(["en-venta"])).toBe("todos");
  });
});

describe("formatAdminSummary", () => {
  it("summarizes publications and units", () => {
    expect(formatAdminSummary(products)).toBe(
      "4 publicaciones · 7 unidades en stock",
    );
    expect(formatAdminSummary([{ stock: 1 }])).toBe(
      "1 publicación · 1 unidad en stock",
    );
    expect(formatAdminSummary([])).toBe("0 publicaciones");
  });
});

describe("formatPhotoCount", () => {
  it("handles zero, one and many", () => {
    expect(formatPhotoCount(0)).toBe("Sin fotos");
    expect(formatPhotoCount(1)).toBe("1 foto");
    expect(formatPhotoCount(5)).toBe("5 fotos");
  });
});
