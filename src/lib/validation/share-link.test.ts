import { describe, expect, it } from "vitest";
import {
  shareLinkErrorsOf,
  shareLinkFromFormData,
  shareLinkSchema,
  shareLinkTarget,
} from "./share-link";

function form(values: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

describe("shareLinkSchema", () => {
  it("accepts a slug and a known source", () => {
    const result = shareLinkSchema.safeParse(
      shareLinkFromFormData(form({ slug: "grupo-facu-", source: "whatsapp" })),
    );
    expect(result.data).toEqual({ slug: "grupo-facu", source: "whatsapp" });
  });

  it("reports an empty name and an unknown source", () => {
    const result = shareLinkSchema.safeParse(
      shareLinkFromFormData(form({ slug: "", source: "tiktok" })),
    );
    expect(shareLinkErrorsOf(result.error!)).toEqual({
      slug: "Escribí un nombre para el link.",
      source: "Elegí dónde lo vas a compartir.",
    });
  });

  it("limits the name to 40 characters", () => {
    const result = shareLinkSchema.safeParse({
      slug: "a".repeat(41),
      source: "otro",
    });
    expect(shareLinkErrorsOf(result.error!).slug).toBeDefined();
  });
});

describe("shareLinkTarget", () => {
  it("sends to the home page with UTM tags", () => {
    expect(shareLinkTarget("familia", "whatsapp")).toBe(
      "/?utm_source=whatsapp&utm_campaign=familia",
    );
  });
});
