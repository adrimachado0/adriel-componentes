import { z } from "zod";
import { finishSlug, isSlug } from "@/lib/slug";

export const SHARE_LINK_SLUG_MAX = 40;

/** utm_source values. The labels are what the admin picks from. */
export const SHARE_SOURCES = {
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  instagram: "Instagram",
  otro: "Otro",
} as const;

export type ShareSource = keyof typeof SHARE_SOURCES;

const SOURCE_VALUES = Object.keys(SHARE_SOURCES) as [
  ShareSource,
  ...ShareSource[],
];

/** Same schema on the client and in the Server Action. */
export const shareLinkSchema = z.object({
  slug: z
    .string()
    .min(1, "Escribí un nombre para el link.")
    .max(
      SHARE_LINK_SLUG_MAX,
      `Usá ${SHARE_LINK_SLUG_MAX} caracteres como máximo.`,
    )
    .refine(
      (value) => isSlug(value, SHARE_LINK_SLUG_MAX),
      "Usá solo letras minúsculas, números y guiones.",
    ),
  source: z.enum(SOURCE_VALUES, "Elegí dónde lo vas a compartir."),
});

export type ShareLinkInput = z.infer<typeof shareLinkSchema>;
export type ShareLinkField = keyof ShareLinkInput;
export type ShareLinkErrors = Partial<Record<ShareLinkField, string>>;

export function shareLinkFromFormData(
  formData: FormData,
): Record<string, unknown> {
  return {
    slug: finishSlug(String(formData.get("slug") ?? "")),
    source: String(formData.get("source") ?? ""),
  };
}

export function shareLinkErrorsOf(error: z.ZodError): ShareLinkErrors {
  const errors: ShareLinkErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if ((field === "slug" || field === "source") && !(field in errors)) {
      errors[field] = issue.message;
    }
  }
  return errors;
}

/** Where /de/<slug> sends the visitor: the home page, tagged for Umami. */
export function shareLinkTarget(slug: string, source: string): string {
  const params = new URLSearchParams({
    utm_source: source,
    utm_campaign: slug,
  });
  return `/?${params}`;
}
