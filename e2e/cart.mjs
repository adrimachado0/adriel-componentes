// Headless check of the cart flow against the running dev server.
//   docker compose up -d && docker compose run --rm e2e cart.mjs
// Works with whatever products exist (needs at least one in stock).
// Screenshots go to e2e/shots/ (git-ignored).
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const OUT = "/e2e/shots";
const NBSP = " ";
const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "✔" : "✘"} ${name}${detail ? ` — ${detail}` : ""}`);
};
const pesos = (text) => Number(text.replace(/\D/g, ""));
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

/** Title, price and stock of every card, read from the page. */
async function readCards(page) {
  return page.locator("article").evaluateAll((articles) =>
    articles.map((a) => {
      const text = a.innerText;
      const stock = /(\d+) disponibles?/.exec(text);
      return {
        title: a.querySelector("h3")?.textContent?.trim() ?? "",
        price: Number(
          (/\$\s?([\d.]+)/.exec(text)?.[1] ?? "0").replace(/\./g, ""),
        ),
        stock: stock ? Number(stock[1]) : 1,
      };
    }),
  );
}

// ---------------------------------------------------------------- desktop
{
  const { page, errors } = await newPage({ width: 1280, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const products = await readCards(page);
  check(
    "store has products",
    products.length > 0,
    `${products.length} in stock`,
  );
  await page.screenshot({ path: `${OUT}/01-home-desktop.png`, fullPage: true });

  const cards = page.locator("article");
  const cartButton = page.getByRole("button", { name: /Abrir carrito/ });
  const first = products[0];

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

  // Fill the first product up to its stock: + must stop there.
  const plus = cards.nth(0).getByRole("button", { name: "Agregar uno" });
  for (let q = 1; q < first.stock; q++) await plus.click();
  check(
    `card shows ${first.stock} en el carrito`,
    await cards.nth(0).getByText(`${first.stock} en el carrito`).isVisible(),
  );
  check("plus disabled at stock", await plus.isDisabled());

  // A second product, if any
  let expected = [{ ...first, quantity: first.stock }];
  if (products.length > 1) {
    await cards
      .nth(1)
      .getByRole("button", { name: "Agregar al carrito" })
      .click();
    expected.push({ ...products[1], quantity: 1 });
  }
  const units = expected.reduce((s, l) => s + l.quantity, 0);
  const total = expected.reduce((s, l) => s + l.price * l.quantity, 0);
  check(
    `badge shows ${units}`,
    (await cartButton.getAttribute("aria-label")) ===
      `Abrir carrito (${units})`,
  );
  await page.screenshot({ path: `${OUT}/02-home-with-cart.png` });

  await page.waitForTimeout(4500); // let the toast go away
  await cartButton.click();
  const dialog = page.getByRole("dialog", { name: "Tu carrito" });
  const wa = dialog.getByRole("link", { name: /Preguntar por WhatsApp/ });
  await wa.waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/03-cart-desktop.png` });

  const text = new URL(await wa.getAttribute("href")).searchParams.get("text");
  console.log(
    "--- WhatsApp message ---\n" + text + "\n------------------------",
  );
  check(
    "message header",
    text.startsWith("Hola Adriel! Te consulto por estos componentes:\n"),
  );
  check(
    "message total",
    text.endsWith(`Total estimado: ${price(total)}`),
    price(total),
  );
  check(
    "message line format",
    text.includes(`• ${first.stock} × ${first.title}`) &&
      text.includes(`— ${price(first.price * first.stock)}`),
  );
  check("summary total", (await dialog.innerText()).includes(price(total)));
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

  await dialog
    .getByRole("button", { name: `Quitar ${first.title} del carrito` })
    .click();
  await page.waitForTimeout(300);
  const left = units - first.stock;
  check(
    "line removed",
    left === 0
      ? await dialog.getByText("Tu carrito está vacío").isVisible()
      : (await cartButton.getAttribute("aria-label")) ===
          `Abrir carrito (${left})`,
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

  // Reconcile: stored quantity above stock + a product that doesn't exist.
  const firstId = await cards
    .nth(0)
    .getByRole("link", { name: first.title, exact: true })
    .getAttribute("href");
  await page.evaluate((id) => {
    localStorage.setItem(
      "adriel-cart:v1",
      JSON.stringify({ [id]: 99, "00000000-0000-4000-8000-000000000000": 1 }),
    );
  }, firstId.split("/").pop());
  await page.reload({ waitUntil: "networkidle" });
  await cartButton.click();
  await dialog.getByRole("link", { name: /Preguntar por WhatsApp/ }).waitFor();
  await page.waitForTimeout(400);
  const dialogText = await dialog.innerText();
  check(
    "notice for removed product",
    dialogText.includes("ya no está disponible"),
  );
  check("notice for clamped quantity", /solo queda/.test(dialogText));
  check(
    `quantity clamped to ${first.stock}`,
    (await cartButton.getAttribute("aria-label")) ===
      `Abrir carrito (${first.stock})`,
  );
  await page.screenshot({ path: `${OUT}/04-cart-notices.png` });

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
  await page
    .locator("article")
    .nth(0)
    .getByRole("button", { name: "Agregar" })
    .click();
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
