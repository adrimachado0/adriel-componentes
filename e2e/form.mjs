// End-to-end check of the product form, photo uploads and the public pages.
//   docker compose run --rm e2e form.mjs      (needs .env.e2e: E2E_EMAIL, E2E_PASSWORD)
// Creates a throwaway product, edits it and deletes it (photos included).
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const OUT = "/e2e/shots";
const { E2E_EMAIL, E2E_PASSWORD } = process.env;
if (!E2E_EMAIL || !E2E_PASSWORD) {
  console.log("(skip) create .env.e2e with E2E_EMAIL and E2E_PASSWORD");
  process.exit(0);
}

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
const page = await context.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));

/** Big PNGs (2400×1800) in different colors, generated in the browser. */
async function makePhotos(colors) {
  const helper = await context.newPage();
  const files = [];
  for (const [i, color] of colors.entries()) {
    const base64 = await helper.evaluate(async (c) => {
      const canvas = document.createElement("canvas");
      canvas.width = 2400;
      canvas.height = 1800;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 2400, 1800);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 400px sans-serif";
      ctx.fillText(c, 200, 1100);
      return canvas.toDataURL("image/png").split(",")[1];
    }, color);
    files.push({
      name: `foto-${i + 1}.png`,
      mimeType: "image/png",
      buffer: Buffer.from(base64, "base64"),
    });
  }
  await helper.close();
  return files;
}

async function tileSources() {
  return page
    .locator(
      "#sec-photos ~ * li img, section[aria-labelledby=sec-photos] li img",
    )
    .evaluateAll((imgs) => imgs.map((i) => i.src));
}

const title = `Producto de prueba E2E ${Date.now()}`;

// ------------------------------------------------------------------ login
await page.goto(`${BASE}/admin/login?next=/admin/nuevo`, {
  waitUntil: "networkidle",
});
await page.getByLabel("Email").fill(E2E_EMAIL);
await page.getByLabel("Contraseña", { exact: true }).fill(E2E_PASSWORD);
await page.getByRole("button", { name: "Ingresar" }).click();
await page.waitForURL((u) => u.pathname === "/admin/nuevo");
await page.getByRole("heading", { name: "Nuevo componente" }).waitFor();
check("login → /admin/nuevo", true);

// ------------------------------------------------------- validation state
await page.getByRole("button", { name: /Publicar componente/ }).click();
const summary = page.getByRole("alert").filter({ hasText: "Faltan" });
await summary.waitFor();
check(
  "error summary",
  (await summary.innerText()).includes("Faltan 2 datos para publicar"),
);
check("title error", await page.getByText("Escribí un título.").isVisible());
check(
  "price error",
  await page.getByText("Ingresá un precio mayor a 0.").isVisible(),
);
check(
  "focus on first invalid field",
  await page.evaluate(() => document.activeElement?.id === "product-title"),
);
await page.screenshot({ path: `${OUT}/30-form-errors.png`, fullPage: true });

// ------------------------------------------------------------ fill + photos
await page.getByLabel("Título").fill(title);
check(
  "error clears while typing",
  !(await page.getByText("Escribí un título.").isVisible()),
);
check("title counter", await page.getByText(`${title.length}/80`).isVisible());
const brandChip = page.getByRole("button", { name: "MSI", exact: true });
if (await brandChip.count()) await brandChip.click();
else await page.getByLabel("Marca").fill("MSI");
await page
  .getByLabel("Descripción")
  .fill("Primera línea de prueba.\nSegunda línea de prueba.");
await page.getByLabel("Precio").fill("123456");
check(
  "price shows thousands separator",
  (await page.getByLabel("Precio").inputValue()) === "123.456",
);
await page.getByRole("button", { name: "Sumar uno" }).click();
check("stock +", (await page.getByLabel("Cantidad").inputValue()) === "2");

const photos = await makePhotos(["#d33", "#3a3", "#33d"]);
await page.locator("#product-photos").setInputFiles(photos);
await page.getByText("3 de 8").waitFor();
await page.waitForFunction(
  () => !document.body.innerText.includes("Subiendo"),
  null,
  { timeout: 60_000 },
);
check("3 photos uploaded", (await page.getByText("No se subió").count()) === 0);
check("first one is the cover", await page.getByText("Portada").isVisible());
check(
  "live preview shows the title",
  (
    await page.getByRole("complementary", { name: "Vista previa" }).innerText()
  ).includes(title),
);
await page.screenshot({ path: `${OUT}/31-form-complete.png`, fullPage: true });

// Reorder with the keyboard: move photo 3 to the first position.
const before = await tileSources();
await page.getByRole("button", { name: "Foto 3" }).focus();
await page.keyboard.press("Space");
await page.keyboard.press("ArrowLeft");
await page.keyboard.press("ArrowLeft");
await page.keyboard.press("Space");
await page.waitForTimeout(400);
const after = await tileSources();
check(
  "keyboard reorder",
  after[0] === before[2] && after[1] === before[0],
  `${after.length} tiles`,
);

// ------------------------------------------------------------------ save
await page.getByRole("button", { name: /Publicar componente/ }).click();
await page.waitForURL((u) => u.pathname === "/admin");
await page.getByText("Componente publicado").waitFor();
check("saved → back to list with toast", true);
const row = page.locator("main li").filter({ hasText: title });
check("new product in the list", (await row.count()) === 1);
const editHref = await row
  .getByRole("link", { name: /^Editar / })
  .getAttribute("href");
const id = editHref.split("/")[2];

// ---------------------------------------------------------- public pages
await page.goto(BASE, { waitUntil: "networkidle" });
const card = page.locator("article").filter({ hasText: title });
check("visible in the store (fresh cache)", (await card.count()) === 1);
check("card shows the photo", (await card.locator("img").count()) === 1);
check(
  "card dots for 3 photos",
  await card.getByRole("img", { name: "3 fotos" }).isVisible(),
);

await page.goto(`${BASE}/producto/${id}`, { waitUntil: "networkidle" });
const paragraphs = await page
  .locator("article")
  .filter({ has: page.getByRole("heading", { level: 1 }) })
  .locator("p")
  .filter({ hasText: "línea de prueba" })
  .count();
check("detail: description paragraphs", paragraphs === 2);
check(
  "detail: 3 thumbnails",
  (await page.getByRole("button", { name: /Ver foto \d de 3/ }).count()) === 3,
);
const coverSrc = await page.locator("article img").first().getAttribute("src");
const natural = await page.evaluate(async (src) => {
  const raw = new URL(src, location.href).searchParams.get("url") ?? src;
  const img = new Image();
  img.src = raw;
  await img.decode();
  return { w: img.naturalWidth, h: img.naturalHeight, raw };
}, coverSrc);
check(
  "stored photo resized to 1600px",
  natural.w === 1600 && natural.h === 1200,
  `${natural.w}×${natural.h}`,
);
const head = await page.request.get(natural.raw);
check(
  "stored photo is WebP",
  head.headers()["content-type"] === "image/webp",
  head.headers()["content-type"],
);

await page.getByRole("button", { name: "Foto siguiente" }).click();
check("next arrow → 2 / 3", await page.getByText("2 / 3").isVisible());
await page.keyboard.press("ArrowRight");
check("arrow key → 3 / 3", await page.getByText("3 / 3").isVisible());
await page.screenshot({ path: `${OUT}/32-detail-with-photos.png` });

const ogUrl = await page
  .locator('meta[property="og:image"]')
  .getAttribute("content");
const ogRes = await page.request.get(ogUrl.replace(/^https?:\/\/[^/]+/, BASE));
check(
  "og:image from the photo (JPEG)",
  ogRes.headers()["content-type"] === "image/jpeg",
);
(await import("node:fs")).writeFileSync(
  `${OUT}/og-with-photo.jpg`,
  await ogRes.body(),
);

// Mobile swipe
const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
const m = await mobile.newPage();
await m.goto(`${BASE}/producto/${id}`, { waitUntil: "networkidle" });
const box = await m
  .locator("article [aria-roledescription=galería] > div")
  .first()
  .boundingBox();
const y = box.y + box.height / 2;
await m.mouse.move(box.x + box.width * 0.8, y);
await m.mouse.down();
await m.mouse.move(box.x + box.width * 0.2, y, { steps: 8 });
await m.mouse.up();
await m.waitForTimeout(500);
check("swipe → 2 / 3", await m.getByText("2 / 3").isVisible());
await m.screenshot({ path: `${OUT}/33-detail-mobile-photos.png` });
await mobile.close();

// ------------------------------------------------------------------- edit
await page.goto(`${BASE}${editHref}`, { waitUntil: "networkidle" });
await page.getByRole("heading", { name: "Editar componente" }).waitFor();
const saved = await tileSources();
check("edit loads 3 photos", saved.length === 3);
await page.getByRole("button", { name: "Quitar foto 2" }).click();
await page.getByLabel("Precio").fill("99000");
check(
  "status: cambios sin guardar",
  await page.getByText("Cambios sin guardar").isVisible(),
);
await page.getByRole("button", { name: /Guardar cambios/ }).click();
await page.waitForURL((u) => u.pathname === "/admin");
await page.getByText("Cambios guardados").waitFor();
check(
  "edit saved",
  (
    await page.locator("main li").filter({ hasText: title }).innerText()
  ).includes("99.000"),
);
const removedStatus = (await page.request.get(saved[1])).status();
check(
  "removed photo deleted from Storage",
  removedStatus >= 400,
  `HTTP ${removedStatus}`,
);

// ----------------------------------------------------------------- delete
const remaining = [saved[0], saved[2]];
const deleteRow = page.locator("main li").filter({ hasText: title });
await deleteRow.getByRole("button", { name: /^Eliminar / }).click();
await page
  .getByRole("alertdialog")
  .getByRole("button", { name: "Eliminar" })
  .click();
await page.getByText("Componente eliminado").waitFor();
await page.waitForTimeout(500);
check(
  "row removed",
  (await page.locator("main li").filter({ hasText: title }).count()) === 0,
);
const statuses = await Promise.all(
  remaining.map(async (src) => (await page.request.get(src)).status()),
);
check(
  "photos deleted from Storage",
  statuses.every((s) => s >= 400),
  statuses.join(","),
);
await page.goto(`${BASE}/producto/${id}`, { waitUntil: "networkidle" });
check(
  "detail now 404",
  (await page.locator("body").innerText()).includes("404"),
);
await page.goto(BASE, { waitUntil: "networkidle" });
check(
  "gone from the store",
  (await page.locator("article").filter({ hasText: title }).count()) === 0,
);

// Mobile form screenshot (new, empty)
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/admin/nuevo`, { waitUntil: "networkidle" });
await page.screenshot({ path: `${OUT}/34-form-mobile.png`, fullPage: true });

const real = errors.filter(
  (e) => !/404|Not Found|Failed to load resource/i.test(e),
);
check("no console errors", real.length === 0, real.join(" | ").slice(0, 400));

await browser.close();
const failed = results.filter((ok) => !ok).length;
console.log(failed ? `\n${failed} check(s) failed` : "\nALL OK");
process.exit(failed ? 1 : 0);
