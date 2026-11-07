import { describe, expect, it } from "vitest";
import { GENERAL_MESSAGE, productMessage, whatsappUrl } from "./whatsapp";

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
