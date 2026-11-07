import { describe, expect, it } from "vitest";
import { resolveSiteUrl } from "./site-url";

describe("resolveSiteUrl", () => {
  it("uses the configured URL, without trailing slash", () => {
    expect(
      resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://adriel.com.ar/" }),
    ).toBe("https://adriel.com.ar");
  });

  it("keeps localhost for local development", () => {
    expect(
      resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000" }),
    ).toBe("http://localhost:3000");
  });

  it("on Vercel, replaces a leftover localhost with the production domain", () => {
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
        VERCEL: "1",
        VERCEL_PROJECT_PRODUCTION_URL: "adriel-componentes.vercel.app",
      }),
    ).toBe("https://adriel-componentes.vercel.app");
  });

  it("on Vercel, a real configured domain wins", () => {
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: "https://adriel.com.ar",
        VERCEL: "1",
        VERCEL_PROJECT_PRODUCTION_URL: "adriel-componentes.vercel.app",
      }),
    ).toBe("https://adriel.com.ar");
  });

  it("on Vercel without a configured URL, uses the production domain", () => {
    expect(
      resolveSiteUrl({
        VERCEL: "1",
        VERCEL_PROJECT_PRODUCTION_URL: "adriel-componentes.vercel.app",
      }),
    ).toBe("https://adriel-componentes.vercel.app");
  });
});
