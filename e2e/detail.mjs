// Headless check of the product detail page against the running dev server.
//   docker compose run --rm [-e SOLD_OUT_ID=<uuid>] e2e detail.mjs
// Works with whatever products exist (needs at least one in stock).
// SOLD_OUT_ID (optional): a product with stock 0, to check "Sin stock".
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const OUT = "/e2e/shots";
const NBSP = " ";
const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "✔" : "✘"} ${name}${detail ? ` — ${detail}` : ""}`);
};
const price = (n) => `$${NBSP}${new Intl.NumberFormat("es-AR").format(n)}`;

const browser = await chromium.launch();

async function newPage(viewport) {
  const context = await browser.newContext({ viewport, locale: "es-AR" });
  const page = await context.newPage();
  const errors = [];
  page.on(
    "console",
    (msg) => msg.type() === "error" && errors.push(msg.text()),
  );
  page.on("pageerror", (err) => errors.push(String(err)));
  return { page, errors };
}

let detailUrl;

// ---------------------------------------------------------------- desktop
{
  const { page, errors } = await newPage({ width: 1280, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const total = await page.locator("article").count();
  const firstCard = page.locator("article").first();
  const title = (await firstCard.locator("h3").innerText()).trim();

  await firstCard.getByRole("link", { name: title, exact: true }).click();
  await page.waitForURL(/\/producto\//);
  const h1 = page.getByRole("heading", { level: 1 });
  await h1.waitFor();
  detailUrl = page.url();
  check(
    "detail opens from card title",
    (await h1.innerText()).trim() === title,
  );

  const info = page.locator("article").filter({ has: h1 });
  const infoText = await info.innerText();
  const priceText = infoText.match(/\$\s?[\d.]+/)?.[0] ?? "";
  const amount = Number(priceText.replace(/\D/g, ""));
  check("price shown", amount > 0, priceText);
  const stockTag = infoText.match(/Última unidad|(\d+) disponibles|Sin stock/);
  check("stock tag", Boolean(stockTag), stockTag?.[0] ?? "");
  const stock =
    stockTag?.[0] === "Última unidad" ? 1 : Number(stockTag?.[1] ?? 0);
  check(
    "breadcrumb",
    await page
      .getByRole("navigation", { name: "Ruta de navegación" })
      .isVisible(),
  );

  const related = await page
    .locator("section[aria-labelledby=related-title] li")
    .count();
  check(
    "related products (up to 4)",
    related === Math.min(4, total - 1),
    `${related}`,
  );

  // Metadata + Open Graph image
  check("document title", (await page.title()).includes(title));
  const ogImage = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content");
  const og = await page.request.get(ogImage.replace(/^https?:\/\/[^/]+/, BASE));
  check(
    "og:image is JPEG",
    og.ok() && og.headers()["content-type"] === "image/jpeg",
    `${(await og.body()).length} bytes`,
  );
  (await import("node:fs")).writeFileSync(
    `${OUT}/og-product.jpg`,
    await og.body(),
  );
  const ogTitle = await page
    .locator('meta[property="og:title"]')
    .getAttribute("content");
  check(
    "og:title includes price",
    Boolean(ogTitle?.includes(price(amount))),
    ogTitle ?? "",
  );

  // WhatsApp message
  const wa = page.getByRole("link", { name: "Preguntar por WhatsApp" }).first();
  const text = new URL(await wa.getAttribute("href")).searchParams.get("text");
  check(
    "product WhatsApp message",
    text.startsWith(`Hola Adriel! Me interesa: ${title}`) &&
      text.endsWith(`a ${price(amount)}. ¿Sigue disponible?`),
    text,
  );

  // Gallery (only when there are several photos)
  const thumbs = await page
    .getByRole("button", { name: /Ver foto \d+ de \d+/ })
    .count();
  if (thumbs > 1) {
    await page.getByRole("button", { name: "Foto siguiente" }).click();
    check(
      "gallery: next arrow → 2 / n",
      await page.getByText(`2 / ${thumbs}`).isVisible(),
    );
    await page
      .getByRole("button", { name: "Ver foto 2 de" + ` ${thumbs}` })
      .focus();
    await page.keyboard.press("ArrowLeft");
    check(
      "gallery: ← key → 1 / n",
      await page.getByText(`1 / ${thumbs}`).isVisible(),
    );
  } else {
    console.log("(skip) gallery navigation: first product has a single photo");
  }

  // Quantity is capped at stock
  if (stock > 0) {
    const plusBtn = page.getByRole("button", { name: "Sumar uno" });
    for (let q = 1; q < stock; q++) await plusBtn.click();
    check("plus disabled at stock", await plusBtn.isDisabled());
    await page.screenshot({
      path: `${OUT}/10-detail-desktop.png`,
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Agregar al carrito" })
      .first()
      .click();
    await page.getByText("Agregado al carrito").waitFor();
    check(
      "adds the selected quantity",
      (await page
        .getByRole("button", { name: /Abrir carrito/ })
        .getAttribute("aria-label")) === `Abrir carrito (${stock})`,
    );
    check(
      "button becomes 'Ya está en tu carrito'",
      await page
        .getByRole("button", { name: "Ya está en tu carrito" })
        .first()
        .isVisible(),
    );
  }

  // Not found (well-formed and malformed ids)
  for (const id of ["00000000-0000-4000-8000-000000000000", "no-existe"]) {
    await page.goto(`${BASE}/producto/${id}`, { waitUntil: "networkidle" });
    const robots = await page
      .locator('meta[name="robots"]')
      .first()
      .getAttribute("content")
      .catch(() => null);
    check(
      `not found: ${id}`,
      (await page
        .getByRole("heading", { name: "No encontramos esta página" })
        .isVisible()) && Boolean(robots?.includes("noindex")),
    );
  }

  if (process.env.SOLD_OUT_ID) {
    await page.goto(`${BASE}/producto/${process.env.SOLD_OUT_ID}`, {
      waitUntil: "networkidle",
    });
    if (await page.getByRole("button", { name: "Sin stock" }).count()) {
      check(
        "sold out: disabled 'Sin stock' button",
        await page
          .getByRole("button", { name: "Sin stock" })
          .first()
          .isDisabled(),
      );
      check(
        "sold out: no quantity selector",
        (await page.getByRole("button", { name: "Sumar uno" }).count()) === 0,
      );
    } else {
      console.log("(skip) SOLD_OUT_ID is not an existing sold-out product");
    }
  }

  const realErrors = errors.filter((e) => !/404|Not Found/i.test(e));
  check(
    "no console errors (desktop)",
    realErrors.length === 0,
    realErrors.join(" | ").slice(0, 400),
  );
}

// ---------------------------------------------------------------- mobile
{
  const { page, errors } = await newPage({ width: 390, height: 844 });
  await page.goto(detailUrl, { waitUntil: "networkidle" });
  await page.getByRole("heading", { level: 1 }).waitFor();
  const bar = page.locator("[data-bottom-bar]");
  check("mobile bottom bar visible", await bar.isVisible());
  const barBox = await bar.boundingBox();
  const fabBox = await page.locator("[data-whatsapp-fab]").boundingBox();
  check(
    "floating WhatsApp sits above the bar",
    fabBox.y + fabBox.height <= barBox.y,
  );
  check(
    "back link",
    await page.getByRole("link", { name: "Componentes" }).first().isVisible(),
  );
  await page.screenshot({ path: `${OUT}/12-detail-mobile.png` });
  await page.screenshot({
    path: `${OUT}/13-detail-mobile-full.png`,
    fullPage: true,
  });

  const addButton = bar.getByRole("button", { name: "Agregar al carrito" });
  if (await addButton.count()) {
    await addButton.click();
    await page.getByText("Agregado al carrito").waitFor();
    await page.waitForTimeout(350);
    const toastBox = await page.getByText("Agregado al carrito").boundingBox();
    check("toast above the bar", toastBox.y + toastBox.height <= barBox.y);
    await page.screenshot({ path: `${OUT}/14-detail-mobile-toast.png` });
  }
  check(
    "no console errors (mobile)",
    errors.length === 0,
    errors.join(" | ").slice(0, 400),
  );
}

await browser.close();
const failed = results.filter((ok) => !ok).length;
console.log(failed ? `\n${failed} check(s) failed` : "\nALL OK");
process.exit(failed ? 1 : 0);
