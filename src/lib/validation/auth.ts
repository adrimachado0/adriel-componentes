import { z } from "zod";

export const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(200),
  remember: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** Always the same message: never reveal whether the email exists. */
export const LOGIN_ERROR = "El email o la contraseña no son correctos.";

/** Only same-site admin paths are allowed as post-login destinations. */
export function safeAdminPath(value: unknown): string {
  if (typeof value !== "string") return "/admin";
  if (!value.startsWith("/admin") || value.startsWith("/admin/login")) {
    return "/admin";
  }
  // Reject protocol-relative or backslash tricks ("//evil", "/admin\\..").
  if (/[\\]|\/\//.test(value)) return "/admin";
  return value;
}
