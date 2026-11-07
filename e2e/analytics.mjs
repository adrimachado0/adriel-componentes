// Product slugs, old-link redirects, share links (/de/<slug>), the
// ?no-contar switch and the Umami events (window.umami is stubbed).
//   docker compose run --rm -e OLD_ID=<product uuid> -e SHARE_LINK=<slug> e2e analytics.mjs
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = "/e2e/shots";
const { OLD_ID, SHARE_LINK } = process.env;

const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "✔" : "✘"} ${name}${detail ? ` — ${detail}` : ""}`);
};

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: "es-AR",
});
// Records every umami.track() call instead of sending it.
await context.addInitScript(() => {
  window.__events = [];
  window.umami = {
    track: (name, data) => window.__events.push({ name, data }),
  };
});
const page = await context.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));
const events = () => page.evaluate(() => window.__events);
// Not networkidle: production prefetches keep a stream open.
const settle = () => page.waitForTimeout(800);

// --- Home: product links use slugs -------------------------------------------
await page.goto(BASE, { waitUntil: "load" });
await settle();
const hrefs = await page
  .locator('a[href^="/producto/"]')
  .evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href")))]);
const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-/;
check(
  "product links use slugs",
  hrefs.length > 0 && hrefs.every((h) => !uuid.test(h)),
  hrefs.slice(0, 3).join(", "),
);

const fab = page.locator("[data-whatsapp-fab]");
check(
  "floating WhatsApp button is tagged",
  (await fab.getAttribute("data-umami-event")) === "whatsapp" &&
    (await fab.getAttribute("data-umami-event-origen")) === "boton-flotante",
);
const cardAsk = page.locator('a[data-umami-event-origen="tarjeta"]').first();
check(
  "card WhatsApp button carries the product",
  Boolean(await cardAsk.getAttribute("data-umami-event-producto")),
);

// --- Brand filter --------------------------------------------------------------
const chip = page.locator('nav[aria-label="Filtrar por marca"] a').nth(1);
const brand = (await chip.textContent())?.trim();
await chip.click();
await page.waitForURL(/marca=/);
await page.waitForTimeout(300);
check(
  "filtrar-marca event",
  (await events()).some(
    (e) => e.name === "filtrar-marca" && e.data.marca === brand,
  ),
  brand,
);

// --- Add to cart from a card -------------------------------------------------
await page.goto(BASE, { waitUntil: "load" });
await settle();
await page.getByRole("button", { name: "Agregar al carrito" }).first().click();
check(
  "agregar-carrito event (card)",
  (await events()).some(
    (e) => e.name === "agregar-carrito" && e.data.origen === "tarjeta",
  ),
);

// --- Product detail ------------------------------------------------------------
await page.goto(`${BASE}${hrefs[0]}`, { waitUntil: "load" });
await settle();
const viewed = (await events()).find((e) => e.name === "ver-producto");
check(
  "ver-producto event",
  Boolean(viewed?.data.producto),
  viewed?.data.producto,
);
check(
  "detail WhatsApp buttons are tagged",
  (await page.locator('a[data-umami-event-origen="detalle"]').count()) === 2,
);
await page.screenshot({ path: `${OUT}/analytics-detail.png` });

// --- Old /producto/<uuid> links ------------------------------------------------
if (OLD_ID) {
  const res = await page.goto(`${BASE}/producto/${OLD_ID}`, {
    waitUntil: "load",
  });
  check(
    "old uuid link redirects to the slug",
    !uuid.test(new URL(page.url()).pathname) &&
      res.request().redirectedFrom() !== null,
    page.url(),
  );
  const img = await page.request.get(
    `${BASE}/producto/${OLD_ID}/compartir.jpg`,
    { maxRedirects: 0 },
  );
  check(
    "old share image URL redirects too",
    img.status() === 308 &&
      /\/producto\/[a-z0-9-]+\/compartir\.jpg/.test(
        img.headers().location ?? "",
      ),
    `${img.status()} ${img.headers().location}`,
  );
}
await page.goto(`${BASE}/producto/00000000-0000-4000-8000-000000000000`, {
  waitUntil: "load",
});
check(
  "unknown uuid → styled 404",
  await page
    .getByRole("heading", { name: "No encontramos esta página" })
    .waitFor({ timeout: 10000 })
    .then(
      () => true,
      () => false,
    ),
);

// --- Share links ----------------------------------------------------------------
if (SHARE_LINK) {
  const res = await page.request.get(`${BASE}/de/${SHARE_LINK}`, {
    maxRedirects: 0,
  });
  const location = res.headers().location ?? "";
  check(
    "/de/<slug> redirects with UTM tags",
    res.status() === 307 &&
      location.includes(`utm_campaign=${SHARE_LINK}`) &&
      location.includes("utm_source="),
    location,
  );
}
const unknown = await page.request.get(`${BASE}/de/no-existe`, {
  maxRedirects: 0,
});
check(
  "unknown share link goes to the store, untagged",
  unknown.status() === 307 && unknown.headers().location === "/",
  unknown.headers().location,
);

// --- ?no-contar / ?contar ---------------------------------------------------------
await page.goto(`${BASE}/?no-contar`, { waitUntil: "load" });
await settle();
await page.waitForTimeout(400);
check(
  "?no-contar excludes this browser",
  (await page.evaluate(() => localStorage.getItem("umami.disabled"))) === "1",
);
check("?no-contar is removed from the URL", !page.url().includes("contar"));
check(
  "confirmation is shown",
  await page.getByText("ya no se cuentan").isVisible(),
);
await page.screenshot({ path: `${OUT}/analytics-no-contar.png` });

await page.goto(`${BASE}/?contar`, { waitUntil: "load" });
await settle();
check(
  "?contar counts it again",
  (await page.evaluate(() => localStorage.getItem("umami.disabled"))) === null,
);

// --- Mobile -------------------------------------------------------------------------
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/?no-contar`, { waitUntil: "load" });
await settle();
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/analytics-no-contar-mobile.png` });

const relevant = errors.filter((e) => !e.includes("404"));
check("no console errors", relevant.length === 0, relevant.join(" | "));

await browser.close();
const failed = results.filter((ok) => !ok).length;
console.log(
  failed === 0 ? "\nAll checks passed" : `\n${failed} check(s) failed`,
);
process.exit(failed === 0 ? 0 : 1);
