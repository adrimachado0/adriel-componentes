import { describe, expect, it } from "vitest";
import { finishSlug, isSlug, sanitizeSlugInput, slugify } from "./slug";

describe("slugify", () => {
  it("lowercases, drops accents and joins words with hyphens", () => {
    expect(slugify("Memoria RAM Fury 16 GB (DDR4)")).toBe(
      "memoria-ram-fury-16-gb-ddr4",
    );
    expect(slugify("Placa de video — Ñandú Edición")).toBe(
      "placa-de-video-nandu-edicion",
    );
  });

  it("trims hyphens at both ends", () => {
    expect(slugify("  ¡Oferta!  ")).toBe("oferta");
  });

  it("returns an empty string when nothing is left", () => {
    expect(slugify("¿¡!?")).toBe("");
  });

  it("cuts at max without leaving a trailing hyphen", () => {
    expect(slugify("abc def", 4)).toBe("abc");
    expect(slugify("a".repeat(100))).toHaveLength(80);
  });
});

describe("isSlug", () => {
  it("accepts lowercase words joined by single hyphens", () => {
    expect(isSlug("rtx-3060")).toBe(true);
    expect(isSlug("facultad")).toBe(true);
  });

  it("rejects other shapes", () => {
    for (const value of ["", "RTX", "a--b", "-a", "a-", "a b", "ñandu"]) {
      expect(isSlug(value)).toBe(false);
    }
  });

  it("respects the max length", () => {
    expect(isSlug("a".repeat(40), 40)).toBe(true);
    expect(isSlug("a".repeat(41), 40)).toBe(false);
  });

  it("rejects UUIDs (old product links)", () => {
    expect(isSlug("0f8fad5b-d9cb-469f-a165-70867728950e")).toBe(false);
  });
});

describe("sanitizeSlugInput / finishSlug", () => {
  it("keeps a trailing hyphen while typing", () => {
    expect(sanitizeSlugInput("Grupo ")).toBe("grupo-");
    expect(sanitizeSlugInput(" Grupo Facu")).toBe("grupo-facu");
  });

  it("finishSlug drops it", () => {
    expect(finishSlug("grupo-")).toBe("grupo");
  });
});
