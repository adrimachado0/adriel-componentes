const priceFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const thousandsFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 0,
});

/** 38000 → "$ 38.000" (with a non-breaking space after the sign). */
export function formatPrice(pesos: number): string {
  return priceFormatter.format(pesos);
}

/** 185000 → "185.000" (no currency sign; used in the admin price input). */
export function formatThousands(value: number): string {
  return thousandsFormatter.format(value);
}

/** 1 → "1 disponible", 3 → "3 disponibles". */
export function formatAvailability(stock: number): string {
  return stock === 1 ? "1 disponible" : `${stock} disponibles`;
}

/** "Kingston · 2 disponibles", or just the availability when there is no brand. */
export function formatBrandAvailability(brand: string, stock: number): string {
  const availability = formatAvailability(stock);
  return brand ? `${brand} · ${availability}` : availability;
}

/** Stock tag on the detail page and related cards. */
export function formatStockLabel(stock: number): string {
  if (stock < 1) return "Sin stock";
  if (stock === 1) return "Última unidad";
  return `${stock} disponibles`;
}
