// URL slugs ("memoria-ram-fury-16-gb"), shared by products and share links.
// Same rules as private.slugify() and the check constraints in the database.

/** Lowercase words of a–z / 0–9 joined by single hyphens. */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const UUID_LIKE_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Valid slug of at most `max` characters (never shaped like a UUID: old product links use the id). */
export function isSlug(value: string, max = 80): boolean {
  return (
    value.length <= max && SLUG_RE.test(value) && !UUID_LIKE_RE.test(value)
  );
}

/** Lowercases, drops accents and turns every run of other characters into "-". */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

/** "Memoria RAM Fury 16 GB (DDR4)" → "memoria-ram-fury-16-gb-ddr4". May be "". */
export function slugify(text: string, max = 80): string {
  return normalize(text)
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/, "");
}

/**
 * Cleans what the admin types in a slug field, keeping a trailing "-" so the
 * next word can be typed. The final value is checked with isSlug().
 */
export function sanitizeSlugInput(text: string, max = 80): string {
  return normalize(text).replace(/^-+/, "").slice(0, max);
}

/** Removes the trailing "-" a slug field may still have while typing. */
export function finishSlug(text: string): string {
  return text.trim().replace(/-+$/, "");
}
