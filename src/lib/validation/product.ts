import { z } from "zod";

export const TITLE_MAX = 80;
export const BRAND_MAX = 40;
export const DESCRIPTION_MAX = 400;
export const MAX_PHOTOS = 8;
export const PRICE_MAX = 999_999_999;
export const STOCK_MAX = 9999;

/** Storage path written by the uploader: products/<uuid>.<webp|jpg|png>. */
export const IMAGE_PATH_RE =
  /^products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg|png)$/;

/** Same schema on the client (instant errors) and in the Server Action. */
export const productSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Escribí un título.")
    .max(TITLE_MAX, `Usá ${TITLE_MAX} caracteres como máximo.`),
  brand: z
    .string()
    .trim()
    .max(BRAND_MAX, `Usá ${BRAND_MAX} caracteres como máximo.`),
  description: z
    .string()
    .trim()
    .max(DESCRIPTION_MAX, `Usá ${DESCRIPTION_MAX} caracteres como máximo.`),
  price: z
    .int("Ingresá un precio mayor a 0.")
    .min(1, "Ingresá un precio mayor a 0.")
    .max(PRICE_MAX, "Revisá el precio."),
  stock: z
    .int("Ingresá una cantidad válida.")
    .min(0, "La cantidad no puede ser negativa.")
    .max(STOCK_MAX, "Revisá la cantidad."),
  images: z
    .array(z.string().regex(IMAGE_PATH_RE, "Foto inválida."))
    .max(MAX_PHOTOS, `Podés subir hasta ${MAX_PHOTOS} fotos.`),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ProductField = keyof ProductInput;
export type FieldErrors = Partial<Record<ProductField, string>>;

/** "185.000" / "$ 185000" → 185000; empty or no digits → NaN. */
export function parsePriceInput(value: string): number {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : Number.NaN;
}

/** Reads the form fields (images travel as a JSON array of paths). */
export function productFromFormData(
  formData: FormData,
): Record<string, unknown> {
  let images: unknown = [];
  try {
    images = JSON.parse(String(formData.get("images") ?? "[]"));
  } catch {
    images = null;
  }
  const stock = String(formData.get("stock") ?? "").trim();
  return {
    title: String(formData.get("title") ?? ""),
    brand: String(formData.get("brand") ?? ""),
    description: String(formData.get("description") ?? "").replace(
      /\r\n/g,
      "\n",
    ),
    price: parsePriceInput(String(formData.get("price") ?? "")),
    stock: stock === "" ? Number.NaN : Number(stock),
    images,
  };
}

/** First message per field, for inline errors. */
export function fieldErrorsOf(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) {
      errors[field as ProductField] = issue.message;
    }
  }
  return errors;
}

const FIELD_NAMES: Record<ProductField, string> = {
  title: "el título",
  brand: "la marca",
  description: "la descripción",
  price: "el precio",
  stock: "la cantidad",
  images: "las fotos",
};

/** "Faltan 2 datos para publicar" + "Completá el título y el precio." */
export function errorSummary(errors: FieldErrors): {
  title: string;
  detail: string;
} | null {
  const fields = (Object.keys(FIELD_NAMES) as ProductField[]).filter(
    (f) => errors[f],
  );
  if (fields.length === 0) return null;
  const names = fields.map((f) => FIELD_NAMES[f]);
  const list =
    names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(", ")} y ${names.at(-1)}`;
  return {
    title:
      fields.length === 1
        ? "Falta 1 dato para publicar"
        : `Faltan ${fields.length} datos para publicar`,
    detail: `Revisá ${list}.`,
  };
}

/** Paths that were saved before and are no longer in the product. */
export function removedImages(
  before: readonly string[],
  after: readonly string[],
) {
  const kept = new Set(after);
  return before.filter((path) => !kept.has(path));
}
