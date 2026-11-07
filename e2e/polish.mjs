// Headless check of 404/SEO/icons/headers/animations against the dev server.
//   docker compose run --rm e2e polish.mjs
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const OUT = "/e2e/shots";
const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "✔" : "✘"} ${name}${detail ? ` — ${detail}` : ""}`);
};

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

// 404s with the store chrome
const res404 = await page.goto(`${BASE}/esta-pagina-no-existe`, {
  waitUntil: "networkidle",
});
check(
  "unknown URL → 404 status",
  res404.status() === 404,
  String(res404.status()),
);
check(
  "styled 404 page",
  await page
    .getByRole("heading", { name: "No encontramos esta página" })
    .isVisible(),
);
check(
  "404 keeps header (cart button)",
  await page.getByRole("button", { name: /Abrir carrito/ }).isVisible(),
);
await page.screenshot({ path: `${OUT}/40-not-found.png` });

await page.goto(`${BASE}/producto/00000000-0000-4000-8000-000000000000`, {
  waitUntil: "networkidle",
});
check(
  "unknown product → styled 404",
  await page
    .getByRole("heading", { name: "No encontramos esta página" })
    .isVisible(),
);

// SEO files
const robots = await (await page.request.get(`${BASE}/robots.txt`)).text();
check("robots disallows /admin", /Disallow: \/admin/.test(robots));
check("robots points to sitemap", /Sitemap: .+\/sitemap\.xml/.test(robots));
const sitemap = await (await page.request.get(`${BASE}/sitemap.xml`)).text();
const urls = sitemap.match(/<loc>/g)?.length ?? 0;
check(
  "sitemap lists home + products",
  urls >= 2 && sitemap.includes("/producto/"),
  `${urls} urls`,
);
check("sitemap excludes admin", !sitemap.includes("/admin"));

// Icons + home OG
await page.goto(BASE, { waitUntil: "networkidle" });
const icon = await page
  .locator('link[rel="icon"]')
  .first()
  .getAttribute("href");
check("favicon is the logo SVG", icon?.includes("icon.svg"), icon ?? "");
const apple = await page
  .locator('link[rel="apple-touch-icon"]')
  .getAttribute("href");
check("apple-touch-icon", Boolean(apple), apple ?? "");
const og = await page
  .locator('meta[property="og:image"]')
  .getAttribute("content");
const ogRes = await page.request.get(og.replace(/^https?:\/\/[^/]+/, BASE));
check("home og:image JPEG", ogRes.headers()["content-type"] === "image/jpeg");
(await import("node:fs")).writeFileSync(
  `${OUT}/og-home.jpg`,
  await ogRes.body(),
);

// Security headers
const home = await page.request.get(BASE);
const h = home.headers();
check(
  "security headers",
  h["x-content-type-options"] === "nosniff" &&
    h["x-frame-options"] === "DENY" &&
    Boolean(h["referrer-policy"]),
  JSON.stringify({ xfo: h["x-frame-options"], rp: h["referrer-policy"] }),
);
check("no x-powered-by", !h["x-powered-by"]);

// Reveal: becomes visible once in view
const grid = page.locator(".reveal").first();
await grid.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
check(
  "section revealed in view",
  (await grid.evaluate((el) => getComputedStyle(el).opacity)) === "1",
);

// Reduced motion: never hidden
const reduced = await browser.newContext({ reducedMotion: "reduce" });
const rp = await reduced.newPage();
await rp.goto(BASE, { waitUntil: "domcontentloaded" });
const reducedOpacity = await rp
  .locator(".reveal")
  .first()
  .evaluate((el) => getComputedStyle(el).opacity)
  .catch(() => "n/a");
check(
  "reduced motion: no fade (opacity 1 immediately)",
  reducedOpacity === "1",
  reducedOpacity,
);
await reduced.close();

// No JS: content still visible
const nojs = await browser.newContext({ javaScriptEnabled: false });
const np = await nojs.newPage();
await np.goto(BASE, { waitUntil: "load" });
const cards = await np.locator("article").count();
const nojsOpacity = await np
  .locator(".reveal")
  .first()
  .evaluate((el) => getComputedStyle(el).opacity)
  .catch(() => "n/a");
check(
  "without JS the catalog is visible",
  cards > 0 && nojsOpacity === "1",
  `${cards} cards, opacity ${nojsOpacity}`,
);
await nojs.close();

// Skip link
await page.goto(BASE, { waitUntil: "networkidle" });
await page.keyboard.press("Tab");
const skip = page.getByRole("link", { name: "Saltar al contenido" });
check("skip link is first and visible on focus", await skip.isVisible());

check("no page errors", errors.length === 0, errors.join(" | ").slice(0, 300));
await browser.close();
const failed = results.filter((ok) => !ok).length;
console.log(failed ? `\n${failed} check(s) failed` : "\nALL OK");
process.exit(failed ? 1 : 0);
