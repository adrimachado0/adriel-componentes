import { describe, expect, it } from "vitest";
import { loginSchema, safeAdminPath } from "./auth";

describe("safeAdminPath", () => {
  it("keeps admin paths", () => {
    expect(safeAdminPath("/admin")).toBe("/admin");
    expect(safeAdminPath("/admin/nuevo")).toBe("/admin/nuevo");
    expect(safeAdminPath("/admin?q=ram&estado=en-venta")).toBe(
      "/admin?q=ram&estado=en-venta",
    );
  });

  it("rejects anything else", () => {
    expect(safeAdminPath(undefined)).toBe("/admin");
    expect(safeAdminPath("https://evil.example")).toBe("/admin");
    expect(safeAdminPath("//evil.example")).toBe("/admin");
    expect(safeAdminPath("/admin//evil.example")).toBe("/admin");
    expect(safeAdminPath("/admin\\evil")).toBe("/admin");
    expect(safeAdminPath("/")).toBe("/admin");
    expect(safeAdminPath("/admin/login")).toBe("/admin");
  });
});

describe("loginSchema", () => {
  it("accepts a valid login", () => {
    expect(
      loginSchema.safeParse({
        email: "adriel@example.com",
        password: "x",
        remember: true,
      }).success,
    ).toBe(true);
  });

  it("rejects invalid emails and empty passwords", () => {
    expect(
      loginSchema.safeParse({ email: "nope", password: "x", remember: true })
        .success,
    ).toBe(false);
    expect(
      loginSchema.safeParse({
        email: "a@b.co",
        password: "",
        remember: false,
      }).success,
    ).toBe(false);
  });
});
