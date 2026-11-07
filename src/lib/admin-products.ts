// Pure helpers for the admin list (search, status tabs, summary).

export type StatusFilter = "todos" | "en-venta" | "sin-stock";

export const STATUS_FILTERS: readonly StatusFilter[] = [
  "todos",
  "en-venta",
  "sin-stock",
];

export function parseStatusFilter(value: unknown): StatusFilter {
  return typeof value === "string" &&
    (STATUS_FILTERS as readonly string[]).includes(value)
    ? (value as StatusFilter)
    : "todos";
}

/** Lowercase and without accents, so "rigido" finds "Disco rígido". */
export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

type Filterable = { title: string; brand: string; stock: number };

export type StatusCounts = Record<StatusFilter, number>;

/**
 * Applies the search (title or brand) and then the status tab.
 * Counts are computed after the search, before the tab.
 */
export function filterAdminProducts<T extends Filterable>(
  products: readonly T[],
  { query, status }: { query: string; status: StatusFilter },
): { visible: T[]; counts: StatusCounts } {
  const needle = normalizeSearch(query);
  const matches = needle
    ? products.filter((p) =>
        normalizeSearch(`${p.title} ${p.brand}`).includes(needle),
      )
    : [...products];

  const counts: StatusCounts = {
    todos: matches.length,
    "en-venta": 0,
    "sin-stock": 0,
  };
  for (const p of matches) counts[p.stock > 0 ? "en-venta" : "sin-stock"]++;

  const visible =
    status === "todos"
      ? matches
      : matches.filter((p) =>
          status === "en-venta" ? p.stock > 0 : p.stock < 1,
        );
  return { visible, counts };
}

/** "9 publicaciones · 15 unidades en stock". */
export function formatAdminSummary(
  products: readonly { stock: number }[],
): string {
  const count = products.length;
  const units = products.reduce((sum, p) => sum + p.stock, 0);
  const publications = count === 1 ? "1 publicación" : `${count} publicaciones`;
  if (count === 0) return publications;
  const stock =
    units === 1 ? "1 unidad en stock" : `${units} unidades en stock`;
  return `${publications} · ${stock}`;
}

export function formatPhotoCount(count: number): string {
  if (count === 0) return "Sin fotos";
  return count === 1 ? "1 foto" : `${count} fotos`;
}
