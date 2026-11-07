// Umami (cloud.umami.is): visits and a few custom events. No cookies.
// The script is only loaded in production (see <Analytics>), so local and
// preview visits are never counted.

export const UMAMI_WEBSITE_ID = "9bd93ac4-0c75-475e-8de5-c7fc3ca6a660";
export const UMAMI_SCRIPT_URL = "https://cloud.umami.is/script.js";
export const UMAMI_DASHBOARD_URL = `https://cloud.umami.is/websites/${UMAMI_WEBSITE_ID}`;

/** Umami skips every event while this localStorage key is set. */
const DISABLED_KEY = "umami.disabled";

export type AnalyticsEvent =
  "ver-producto" | "agregar-carrito" | "filtrar-marca" | "whatsapp";

/** Where a WhatsApp button lives (the "origen" of a "whatsapp" event). */
export type WhatsAppOrigin =
  "boton-flotante" | "pie" | "error-404" | "tarjeta" | "detalle" | "carrito";

export type EventData = Record<string, string | number>;

declare global {
  interface Window {
    umami?: { track(event: string, data?: EventData): void };
  }
}

// Events fired before the script finished loading (e.g. "ver-producto" on
// the first render). Bounded in case the script is blocked.
const pending: [AnalyticsEvent, EventData | undefined][] = [];
const MAX_PENDING = 20;

/** Sends a custom event (no-op on the server, outside production or when excluded). */
export function track(event: AnalyticsEvent, data?: EventData) {
  if (typeof window === "undefined") return;
  if (window.umami) {
    window.umami.track(event, data);
  } else if (pending.length < MAX_PENDING) {
    pending.push([event, data]);
  }
}

/** Called once the Umami script has loaded. */
export function flushPendingEvents() {
  if (!window.umami) return;
  for (const [event, data] of pending.splice(0)) {
    window.umami.track(event, data);
  }
}

/**
 * data-umami-event attributes for links that open in a new tab (WhatsApp),
 * usable from Server Components. Umami tracks the click itself.
 * Not for same-tab links: Umami would turn them into full page loads.
 */
export function eventAttributes(
  event: AnalyticsEvent,
  data: EventData = {},
): Record<`data-umami-event${string}`, string> {
  const attributes: Record<`data-umami-event${string}`, string> = {
    "data-umami-event": event,
  };
  for (const [key, value] of Object.entries(data)) {
    attributes[`data-umami-event-${key}`] = String(value);
  }
  return attributes;
}

/** Data attributes for a "whatsapp" click. */
export function whatsappEvent(origin: WhatsAppOrigin, data: EventData = {}) {
  return eventAttributes("whatsapp", { origen: origin, ...data });
}

/** Stops counting this browser (the owner's own visits). */
export function excludeThisBrowser() {
  try {
    localStorage.setItem(DISABLED_KEY, "1");
  } catch {
    // Storage blocked (private mode): nothing to remember.
  }
}

export function includeThisBrowser() {
  try {
    localStorage.removeItem(DISABLED_KEY);
  } catch {
    // Storage blocked: Umami cannot read the flag either.
  }
}
