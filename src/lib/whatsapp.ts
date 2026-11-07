import { formatPrice } from "./format";

export const GENERAL_MESSAGE =
  "Hola Adriel! Vi tu página de componentes y quería hacerte una consulta.";

type ProductForMessage = {
  title: string;
  brand: string;
  price: number;
};

function titleWithBrand({ title, brand }: Omit<ProductForMessage, "price">) {
  return brand ? `${title} (${brand})` : title;
}

/** https://wa.me/<number>?text=<encoded message> */
export function whatsappUrl(phoneNumber: string, message: string): string {
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

/** "Hola Adriel! Me interesa: <title> (<brand>) a $ X. ¿Sigue disponible?" */
export function productMessage(product: ProductForMessage): string {
  return `Hola Adriel! Me interesa: ${titleWithBrand(product)} a ${formatPrice(product.price)}. ¿Sigue disponible?`;
}
