// Measures client navigations (time + whether a loading skeleton flashed).
// Meant for a PRODUCTION server (next build && next start): prefetching is
// disabled in `next dev`, so dev numbers are not representative.
//   BASE=http://localhost:3000 node navigation.mjs
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = "/e2e/shots";
const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "✔" : "✘"} ${name}${detail ? ` — ${detail}` : ""}`);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

// Records whether any loading skeleton (aria-busy) appears during a navigation.
await page.addInitScript(() => {
  window.__sawSkeleton = false;
  new MutationObserver(() => {
    if (document.querySelector('[aria-busy="true"]'))
      window.__sawSkeleton = true;
  }).observe(document, { childList: true, subtree: true });
});

async function navigate(label, action, ready) {
  await page.evaluate(() => (window.__sawSkeleton = false));
  const start = Date.now();
  await action();
  await ready();
  const ms = Date.now() - start;
  const skeleton = await page.evaluate(() => window.__sawSkeleton);
  check(`${label}: no loading skeleton`, !skeleton, `${ms} ms`);
  return ms;
}

await page.goto(BASE, { waitUntil: "load" });
// Note: never use "networkidle" here; Next keeps some prefetch reads open.
await page.waitForTimeout(1500); // let prefetches finish
const title = (await page.locator("article h3").first().innerText()).trim();
const h1 = page.getByRole("heading", { level: 1 });

await navigate(
  "home → product",
  () =>
    page
      .locator("article")
      .first()
      .getByRole("link", { name: title, exact: true })
      .click(),
  () => h1.filter({ hasText: title }).waitFor(),
);
await page.waitForTimeout(1500);

await navigate(
  "product → home (back button)",
  () => page.goBack(),
  () => page.locator("article").first().waitFor(),
);

await navigate(
  "home → same product again",
  () =>
    page
      .locator("article")
      .first()
      .getByRole("link", { name: title, exact: true })
      .click(),
  () => h1.filter({ hasText: title }).waitFor(),
);
await page.waitForTimeout(1500);

await navigate(
  "product → home (logo)",
  () => page.getByRole("link", { name: "Adriel Componentes, inicio" }).click(),
  () => page.locator("article").first().waitFor(),
);
await page.waitForTimeout(1500);

const chip = page
  .getByRole("navigation", { name: "Filtrar por marca" })
  .getByRole("link")
  .nth(1);
const brand = (await chip.innerText()).trim();
await navigate(
  `home → brand filter (${brand})`,
  () => chip.click(),
  () =>
    page
      .waitForURL(/marca=/)
      .then(() =>
        page
          .locator('[aria-current="true"]')
          .filter({ hasText: brand })
          .waitFor(),
      ),
);

// Visual check: photos are not cropped (object-contain) and the new icons.
await page.goto(BASE, { waitUntil: "load" });
// Note: never use "networkidle" here; Next keeps some prefetch reads open.
const fit = await page
  .locator("article img")
  .first()
  .evaluate((img) => getComputedStyle(img).objectFit);
check("card photos are not cropped", fit === "contain", fit);
await page.screenshot({ path: `${OUT}/50-home-contain.png`, fullPage: true });
await page
  .locator("article")
  .first()
  .getByRole("link", { name: title, exact: true })
  .click();
await h1.waitFor();
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/51-detail-contain.png` });
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(BASE, { waitUntil: "load" });
await mobile.screenshot({ path: `${OUT}/52-home-mobile.png`, fullPage: true });

await browser.close();
const failed = results.filter((ok) => !ok).length;
console.log(failed ? `\n${failed} check(s) failed` : "\nALL OK");
process.exit(failed ? 1 : 0);
