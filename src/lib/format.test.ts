import { describe, expect, it } from "vitest";
import {
  formatAvailability,
  formatBrandAvailability,
  formatPrice,
  formatStockLabel,
  formatThousands,
} from "./format";

// Intl uses a non-breaking space between "$" and the amount.
const nbsp = " ";

describe("formatPrice", () => {
  it("formats pesos with thousands separator and no cents", () => {
    expect(formatPrice(38000)).toBe(`$${nbsp}38.000`);
    expect(formatPrice(185000)).toBe(`$${nbsp}185.000`);
    expect(formatPrice(1250000)).toBe(`$${nbsp}1.250.000`);
  });

  it("handles small amounts", () => {
    expect(formatPrice(0)).toBe(`$${nbsp}0`);
    expect(formatPrice(999)).toBe(`$${nbsp}999`);
  });

  it("rounds instead of showing cents", () => {
    expect(formatPrice(1999.6)).toBe(`$${nbsp}2.000`);
  });
});

describe("formatThousands", () => {
  it("adds the dot separator", () => {
    expect(formatThousands(185000)).toBe("185.000");
    expect(formatThousands(1000)).toBe("1.000");
    expect(formatThousands(42)).toBe("42");
  });
});

describe("formatAvailability", () => {
  it("uses singular for one unit", () => {
    expect(formatAvailability(1)).toBe("1 disponible");
  });

  it("uses plural otherwise", () => {
    expect(formatAvailability(4)).toBe("4 disponibles");
  });
});

describe("formatBrandAvailability", () => {
  it("joins brand and availability", () => {
    expect(formatBrandAvailability("Kingston", 2)).toBe(
      "Kingston · 2 disponibles",
    );
  });

  it("omits an empty brand", () => {
    expect(formatBrandAvailability("", 1)).toBe("1 disponible");
  });
});

describe("formatStockLabel", () => {
  it("covers sold out, last unit and several units", () => {
    expect(formatStockLabel(0)).toBe("Vendido");
    expect(formatStockLabel(1)).toBe("Última unidad");
    expect(formatStockLabel(3)).toBe("3 disponibles");
  });
});
