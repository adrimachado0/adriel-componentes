import { describe, expect, it } from "vitest";
import {
  errorSummary,
  fieldErrorsOf,
  parsePriceInput,
  productFromFormData,
  productSchema,
  removedImages,
} from "./product";

const PHOTO = "products/0b9b3e6e-2c1f-4c55-9a43-6d0f0b1d7e21.webp";

function form(values: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

describe("parsePriceInput", () => {
  it("keeps only digits", () => {
    expect(parsePriceInput("185.000")).toBe(185000);
    expect(parsePriceInput("$ 1.250.000")).toBe(1250000);
    expect(parsePriceInput("")).toBeNaN();
    expect(parsePriceInput("abc")).toBeNaN();
  });
});

describe("productSchema via productFromFormData", () => {
  it("accepts a complete product", () => {
    const result = productSchema.safeParse(
      productFromFormData(
        form({
          title: "  Placa de video GTX 1660  ",
          brand: "MSI",
          description: "Línea 1\r\nLínea 2",
          price: "185.000",
          stock: "1",
          images: JSON.stringify([PHOTO]),
        }),
      ),
    );
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      title: "Placa de video GTX 1660",
      brand: "MSI",
      description: "Línea 1\nLínea 2",
      price: 185000,
      stock: 1,
      images: [PHOTO],
    });
  });

  it("reports title and price like the design's error state", () => {
    const result = productSchema.safeParse(
      productFromFormData(form({ title: " ", price: "", stock: "1" })),
    );
    expect(result.success).toBe(false);
    const errors = fieldErrorsOf(result.error!);
    expect(errors).toEqual({
      title: "Escribí un título.",
      price: "Ingresá un precio mayor a 0.",
    });
    expect(errorSummary(errors)).toEqual({
      title: "Faltan 2 datos para publicar",
      detail: "Revisá el título y el precio.",
    });
  });

  it("enforces lengths, stock and price limits", () => {
    const result = productSchema.safeParse({
      title: "x".repeat(81),
      brand: "b".repeat(41),
      description: "d".repeat(1001),
      price: 0,
      stock: -1,
      images: [],
    });
    expect(Object.keys(fieldErrorsOf(result.error!)).sort()).toEqual(
      ["brand", "description", "price", "stock", "title"].sort(),
    );
  });

  it("rejects foreign image paths and more than 8 photos", () => {
    const bad = productSchema.safeParse({
      title: "a",
      brand: "",
      description: "",
      price: 1,
      stock: 1,
      images: ["../secret.png"],
    });
    expect(fieldErrorsOf(bad.error!).images).toBe("Foto inválida.");

    const tooMany = productSchema.safeParse({
      title: "a",
      brand: "",
      description: "",
      price: 1,
      stock: 1,
      images: Array.from({ length: 9 }, () => PHOTO),
    });
    expect(fieldErrorsOf(tooMany.error!).images).toBe(
      "Podés subir hasta 8 fotos.",
    );
  });

  it("treats malformed images JSON as invalid", () => {
    const result = productSchema.safeParse(
      productFromFormData(
        form({ title: "a", price: "1", stock: "1", images: "{oops" }),
      ),
    );
    expect(result.success).toBe(false);
  });
});

describe("removedImages", () => {
  it("returns saved paths that are no longer used", () => {
    expect(removedImages(["a", "b", "c"], ["c", "a", "d"])).toEqual(["b"]);
    expect(removedImages([], ["a"])).toEqual([]);
  });
});

describe("errorSummary", () => {
  it("is null without errors and singular with one", () => {
    expect(errorSummary({})).toBeNull();
    expect(errorSummary({ title: "x" })).toEqual({
      title: "Falta 1 dato para publicar",
      detail: "Revisá el título.",
    });
  });
});
