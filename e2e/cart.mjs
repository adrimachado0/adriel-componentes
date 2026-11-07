// Headless check of the cart flow against the running dev server.
//   docker compose up -d && docker compose run --rm e2e cart.mjs
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
  return { context, page, errors };
}

// ---------------------------------------------------------------- desktop
{
  const { page, errors } = await newPage({ width: 1280, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT}/01-home-desktop.png`, fullPage: true });

  const cards = page.locator("article");
  const cartButton = page.getByRole("button", { name: /Abrir carrito/ });

  // Add RAM (stock 2)
  await cards
    .nth(0)
    .getByRole("button", { name: "Agregar al carrito" })
    .click();
  const toast = page.getByText("Agregado al carrito");
  await toast.waitFor();
  check("toast appears after adding", await toast.isVisible());
  check(
    "badge shows 1",
    (await cartButton.getAttribute("aria-label")) === "Abrir carrito (1)",
  );

  const ramPlus = cards.nth(0).getByRole("button", { name: "Agregar uno" });
  await ramPlus.click();
  check(
    "card shows quantity",
    await cards.nth(0).getByText("2 en el carrito").isVisible(),
  );
  check("plus disabled at stock", await ramPlus.isDisabled());

  // Add SSD and CPU → same cart as the design (total $ 213.000)
  await cards
    .nth(2)
    .getByRole("button", { name: "Agregar al carrito" })
    .click();
  await cards
    .nth(3)
    .getByRole("button", { name: "Agregar al carrito" })
    .click();
  check(
    "badge shows 4",
    (await cartButton.getAttribute("aria-label")) === "Abrir carrito (4)",
  );
  await page.screenshot({ path: `${OUT}/02-home-with-cart.png` });

  // Open the cart
  await page.waitForTimeout(4500); // let the toast go away
  await cartButton.click();
  const dialog = page.getByRole("dialog", { name: "Tu carrito" });
  await dialog.waitFor();
  const wa = dialog.getByRole("link", { name: /Preguntar por WhatsApp/ });
  await wa.waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/03-cart-desktop.png` });

  const text = new URL(await wa.getAttribute("href")).searchParams.get("text");
  console.log(
    "--- WhatsApp message ---\n" + text + "\n------------------------",
  );
  check("message total", text.includes("Total estimado: $ 213.000"));
  check(
    "message line",
    text.includes(
      "• 2 × Memoria RAM Fury Beast 16 GB (2×8) DDR4 3200 MHz (Kingston) — $ 76.000",
    ),
  );
  check(
    "focus starts on close button",
    (await page.evaluate(() =>
      document.activeElement?.getAttribute("aria-label"),
    )) === "Cerrar carrito",
  );

  for (let i = 0; i < 25; i++) await page.keyboard.press("Tab");
  check(
    "focus trapped in dialog",
    await dialog.evaluate((el) => el.contains(document.activeElement)),
  );
  check(
    "background scroll locked",
    await page.evaluate(
      () => getComputedStyle(document.documentElement).overflow === "hidden",
    ),
  );
  check(
    "floating WhatsApp hidden",
    !(await page.locator("[data-whatsapp-fab]").isVisible()),
  );

  // Remove one line (SSD) via trash
  await dialog.getByRole("button", { name: /Quitar SSD/ }).click();
  await page.waitForTimeout(300);
  check(
    "line removed",
    (await cartButton.getAttribute("aria-label")) === "Abrir carrito (3)",
  );

  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "detached" });
  check("Esc closes", true);
  check(
    "focus returns to cart button",
    await page.evaluate(() =>
      document.activeElement
        ?.getAttribute("aria-label")
        ?.startsWith("Abrir carrito"),
    ),
  );

  // Reconcile: stale quantity + deleted product stored in localStorage
  const ids = await page.evaluate(() =>
    Object.keys(JSON.parse(localStorage.getItem("adriel-cart:v1"))),
  );
  await page.evaluate((ramId) => {
    localStorage.setItem(
      "adriel-cart:v1",
      JSON.stringify({ [ramId]: 9, "00000000-0000-4000-8000-000000000000": 1 }),
    );
  }, ids[0]);
  await page.reload({ waitUntil: "networkidle" });
  await cartButton.click();
  await dialog.waitFor();
  await dialog.getByRole("link", { name: /Preguntar por WhatsApp/ }).waitFor();
  await page.waitForTimeout(400);
  const dialogText = await dialog.innerText();
  check(
    "notice for removed product",
    dialogText.includes("ya no está disponible"),
  );
  check(
    "notice for clamped quantity",
    dialogText.includes("solo quedan 2 unidades"),
  );
  check(
    "quantity clamped to 2",
    (await cartButton.getAttribute("aria-label")) === "Abrir carrito (2)",
  );
  await page.screenshot({ path: `${OUT}/04-cart-notices.png` });

  // Empty
  await dialog.getByRole("button", { name: "Vaciar carrito" }).click();
  await dialog.getByText("Tu carrito está vacío").waitFor();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/05-cart-empty.png` });
  check("empty state", true);

  check(
    "no console errors (desktop)",
    errors.length === 0,
    errors.join(" | ").slice(0, 400),
  );
}

// ---------------------------------------------------------------- mobile
{
  const { page, errors } = await newPage({ width: 390, height: 844 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT}/06-home-mobile.png`, fullPage: true });
  const cards = page.locator("article");
  await cards.nth(0).getByRole("button", { name: "Agregar" }).click();
  await cards.nth(2).getByRole("button", { name: "Agregar" }).click();
  await page.screenshot({ path: `${OUT}/07-mobile-toast.png` });
  await page.getByRole("button", { name: /Abrir carrito/ }).click();
  const dialog = page.getByRole("dialog", { name: "Tu carrito" });
  await dialog.getByRole("link", { name: /Preguntar por WhatsApp/ }).waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/08-cart-mobile.png` });
  const box = await dialog.boundingBox();
  check(
    "mobile sheet starts 48px from top",
    Math.round(box.y) === 48,
    `y=${box.y}`,
  );
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
