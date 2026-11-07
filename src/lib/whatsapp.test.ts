import { describe, expect, it } from "vitest";
import {
  cartMessage,
  GENERAL_MESSAGE,
  productMessage,
  whatsappUrl,
} from "./whatsapp";

const nbsp = " ";

describe("whatsappUrl", () => {
  it("builds a wa.me link with the encoded text", () => {
    const url = whatsappUrl("5493416165720", "Hola! ¿Sigue disponible?");
    expect(url).toBe(
      "https://wa.me/5493416165720?text=Hola!%20%C2%BFSigue%20disponible%3F",
    );
    expect(new URL(url).searchParams.get("text")).toBe(
      "Hola! ¿Sigue disponible?",
    );
  });

  it("encodes the general message", () => {
    const url = new URL(whatsappUrl("5493416165720", GENERAL_MESSAGE));
    expect(url.searchParams.get("text")).toBe(
      "Hola Adriel! Vi tu página de componentes y quería hacerte una consulta.",
    );
  });
});

describe("productMessage", () => {
  it("includes title, brand and formatted price", () => {
    expect(
      productMessage({
        title: "Placa de video GeForce GTX 1660 Super 6 GB",
        brand: "MSI",
        price: 185000,
      }),
    ).toBe(
      `Hola Adriel! Me interesa: Placa de video GeForce GTX 1660 Super 6 GB (MSI) a $${nbsp}185.000. ¿Sigue disponible?`,
    );
  });

  it("omits the parentheses when there is no brand", () => {
    expect(productMessage({ title: "Gabinete", brand: "", price: 20000 })).toBe(
      `Hola Adriel! Me interesa: Gabinete a $${nbsp}20.000. ¿Sigue disponible?`,
    );
  });
});

describe("cartMessage", () => {
  it("lists every line with quantity, brand and subtotal, plus the total", () => {
    const message = cartMessage([
      {
        title: "Memoria RAM Fury Beast 16 GB (2×8) DDR4 3200 MHz",
        brand: "Kingston",
        price: 38000,
        quantity: 2,
      },
      {
        title: "SSD NVMe 980 512 GB M.2",
        brand: "Samsung",
        price: 42000,
        quantity: 1,
      },
      {
        title: "Procesador Ryzen 5 3600 AM4",
        brand: "AMD",
        price: 95000,
        quantity: 1,
      },
    ]);
    expect(message).toBe(
      [
        "Hola Adriel! Te consulto por estos componentes:",
        `• 2 × Memoria RAM Fury Beast 16 GB (2×8) DDR4 3200 MHz (Kingston) — $${nbsp}76.000`,
        `• 1 × SSD NVMe 980 512 GB M.2 (Samsung) — $${nbsp}42.000`,
        `• 1 × Procesador Ryzen 5 3600 AM4 (AMD) — $${nbsp}95.000`,
        `Total estimado: $${nbsp}213.000`,
      ].join("\n"),
    );
  });

  it("survives the wa.me round trip with line breaks", () => {
    const message = cartMessage([
      { title: "Cooler", brand: "", price: 30000, quantity: 1 },
    ]);
    const url = new URL(whatsappUrl("5493416165720", message));
    expect(url.searchParams.get("text")).toBe(message);
    expect(url.search).toContain("%0A");
  });
});
