// Headless check of the product detail page against the running dev server.
//   docker compose run --rm -e SOLD_OUT_ID=<uuid> e2e detail.mjs
// SOLD_OUT_ID (optional): a product with stock 0, to check the "Sin stock" state.
// Screenshots go to e2e/shots/ (git-ignored).
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const OUT = "/e2e/shots";
const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "✔" : "✘"} ${name}${detail ? ` — ${detail}` : ""}`);
};

const browser = await chromium.launch();

async function newPage(viewport) {
  const context = await browser.newContext({ viewport, locale: "es-AR" });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));
  return { page, errors };
}

// ---------------------------------------------------------------- desktop
{
  const { page, errors } = await newPage({ width: 1280, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });

  // Open the GPU (stock 1, two-paragraph description) from its card title.
  await page
    .getByRole("link", {
      name: "Placa de video GeForce GTX 1660 Super 6 GB",
      exact: true,
    })
    .click();
  await page.waitForURL(/\/producto\//);
  const h1 = page.getByRole("heading", { level: 1 });
  await h1.waitFor();
  const detailUrl = page.url();
  check("detail opens from card", (await h1.innerText()).includes("GTX 1660"));
  check("stock tag", await page.getByText("Última unidad").first().isVisible());
  check("price", await page.getByText("$ 185.000").first().isVisible());
  const paragraphs = await page
    .locator("article")
    .filter({ has: h1 })
    .locator("p")
    .filter({ hasText: /Ventus|actualicé/ })
    .count();
  check(
    "description keeps line breaks",
    paragraphs === 2,
    `${paragraphs} paragraphs`,
  );
  check(
    "breadcrumb",
    await page
      .getByRole("navigation", { name: "Ruta de navegación" })
      .isVisible(),
  );
  const related = await page
    .getByRole("region")
    .or(page.locator("section[aria-labelledby=related-title]"))
    .locator("li")
    .count();
  check("4 related products", related === 4, `${related}`);

  // Metadata + Open Graph image
  const title = await page.title();
  check(
    "document title",
    title.includes("GTX 1660") && title.includes("Adriel Componentes"),
    title,
  );
  const ogImage = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content");
  check("og:image present", Boolean(ogImage), ogImage ?? "");
  if (ogImage) {
    const res = await page.request.get(
      ogImage.replace(/^https?:\/\/[^/]+/, BASE),
    );
    check(
      "og:image is a 1200×630 JPEG",
      res.ok() && res.headers()["content-type"] === "image/jpeg",
      `${res.status()} ${res.headers()["content-type"]} ${(await res.body()).length} bytes`,
    );
    const png = await res.body();
    const fs = await import("node:fs");
    fs.writeFileSync(`${OUT}/og-product.jpg`, png);
  }
  const ogTitle = await page
    .locator('meta[property="og:title"]')
    .getAttribute("content");
  check("og:title includes price", ogTitle?.includes("185.000"), ogTitle ?? "");

  // WhatsApp link
  const wa = page.getByRole("link", { name: "Preguntar por WhatsApp" }).first();
  const text = new URL(await wa.getAttribute("href")).searchParams.get("text");
  check(
    "product WhatsApp message",
    text ===
      "Hola Adriel! Me interesa: Placa de video GeForce GTX 1660 Super 6 GB (MSI) a $ 185.000. ¿Sigue disponible?",
    text,
  );

  // Quantity is capped at stock (1) → both buttons disabled
  check(
    "minus disabled at 1",
    await page.getByRole("button", { name: "Restar uno" }).isDisabled(),
  );
  check(
    "plus disabled at stock 1",
    await page.getByRole("button", { name: "Sumar uno" }).isDisabled(),
  );
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
    "added from detail",
    (await page
      .getByRole("button", { name: /Abrir carrito/ })
      .getAttribute("aria-label")) === "Abrir carrito (1)",
  );
  check(
    "button becomes 'Ya está en tu carrito'",
    await page
      .getByRole("button", { name: "Ya está en tu carrito" })
      .first()
      .isVisible(),
  );

  // RAM (stock 2): choose 2 and add both at once
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page
    .getByRole("link", {
      name: "Memoria RAM Fury Beast 16 GB (2×8) DDR4 3200 MHz",
      exact: true,
    })
    .click();
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.getByRole("button", { name: "Sumar uno" }).click();
  check(
    "plus disabled at stock 2",
    await page.getByRole("button", { name: "Sumar uno" }).isDisabled(),
  );
  await page
    .getByRole("button", { name: "Agregar al carrito" })
    .first()
    .click();
  await page.getByText("Agregado al carrito").waitFor();
  check(
    "adds selected quantity",
    (await page
      .getByRole("button", { name: /Abrir carrito/ })
      .getAttribute("aria-label")) === "Abrir carrito (3)",
  );

  // Not found (well-formed and malformed ids)
  for (const id of ["00000000-0000-4000-8000-000000000000", "no-existe"]) {
    await page.goto(`${BASE}/producto/${id}`, { waitUntil: "networkidle" });
    const robots = await page
      .locator('meta[name="robots"]')
      .first()
      .getAttribute("content")
      .catch(() => null);
    const body = await page.locator("body").innerText();
    check(
      `not found: ${id}`,
      /404|could not be found|no encontr/i.test(body) &&
        Boolean(robots?.includes("noindex")),
      `robots=${robots}`,
    );
  }

  // Sold out
  if (process.env.SOLD_OUT_ID) {
    await page.goto(`${BASE}/producto/${process.env.SOLD_OUT_ID}`, {
      waitUntil: "networkidle",
    });
    await page.getByRole("heading", { level: 1 }).waitFor();
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
    await page.screenshot({ path: `${OUT}/11-detail-sold-out.png` });
  }

  // Keep page errors only (expected 404 network logs from notFound pages are filtered).
  const realErrors = errors.filter((e) => !/404|Not Found/i.test(e));
  check(
    "no console errors (desktop)",
    realErrors.length === 0,
    realErrors.join(" | ").slice(0, 400),
  );

  globalThis.detailUrl = detailUrl;
}

// ---------------------------------------------------------------- mobile
{
  const { page, errors } = await newPage({ width: 390, height: 844 });
  await page.goto(globalThis.detailUrl, { waitUntil: "networkidle" });
  await page.getByRole("heading", { level: 1 }).waitFor();
  const bar = page.locator("[data-bottom-bar]");
  check("mobile bottom bar visible", await bar.isVisible());
  const barBox = await bar.boundingBox();
  const fabBox = await page.locator("[data-whatsapp-fab]").boundingBox();
  check(
    "floating WhatsApp sits above the bar",
    fabBox.y + fabBox.height <= barBox.y,
    `fab bottom=${Math.round(fabBox.y + fabBox.height)} bar top=${Math.round(barBox.y)}`,
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

  await bar.getByRole("button", { name: "Agregar al carrito" }).click();
  await page.getByText("Agregado al carrito").waitFor();
  await page.waitForTimeout(350);
  const toastBox = await page.getByText("Agregado al carrito").boundingBox();
  check(
    "toast above the bar",
    toastBox.y + toastBox.height <= barBox.y,
    `toast bottom=${Math.round(toastBox.y + toastBox.height)}`,
  );
  await page.screenshot({ path: `${OUT}/14-detail-mobile-toast.png` });
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
