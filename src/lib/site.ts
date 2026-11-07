import { env } from "./env";
import { GENERAL_MESSAGE, whatsappUrl } from "./whatsapp";

export const SITE_NAME = "Adriel Componentes";

export const contact = {
  whatsappNumber: env.whatsappNumber,
  whatsappGeneralUrl: whatsappUrl(env.whatsappNumber, GENERAL_MESSAGE),
  email: env.contactEmail,
} as const;

/** Public URL of an object in the product-images bucket. */
export function productImageUrl(path: string): string {
  return `${env.supabaseUrl}/storage/v1/object/public/product-images/${path}`;
}
