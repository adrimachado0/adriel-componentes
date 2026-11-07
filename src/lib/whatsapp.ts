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

type CartLineForMessage = ProductForMessage & { quantity: number };

/**
 * Hola Adriel! Te consulto por estos componentes:
 * • 2 × <title> (<brand>) — $ 76.000
 * Total estimado: $ 213.000
 */
export function cartMessage(lines: readonly CartLineForMessage[]): string {
  let total = 0;
  const rows = lines.map((line) => {
    const subtotal = line.price * line.quantity;
    total += subtotal;
    return `• ${line.quantity} × ${titleWithBrand(line)} — ${formatPrice(subtotal)}`;
  });
  return [
    "Hola Adriel! Te consulto por estos componentes:",
    ...rows,
    `Total estimado: ${formatPrice(total)}`,
  ].join("\n");
}
