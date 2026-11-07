// Headless check of the admin login and list against the running dev server.
//   docker compose run --rm e2e admin.mjs
// Logged-in checks need E2E_EMAIL / E2E_PASSWORD in .env.e2e (git-ignored).
// Leaves the data as it found it (stock changes are reverted).
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const OUT = "/e2e/shots";
const { E2E_EMAIL, E2E_PASSWORD } = process.env;
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

// ------------------------------------------------------- without session
{
  const { page, errors } = await newPage({ width: 1280, height: 860 });

  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  check(
    "/admin redirects to login",
    new URL(page.url()).pathname === "/admin/login",
  );

  await page.goto(`${BASE}/admin/nuevo`, { waitUntil: "networkidle" });
  const url = new URL(page.url());
  check(
    "deep link keeps ?next",
    url.pathname === "/admin/login" &&
      url.searchParams.get("next") === "/admin/nuevo",
    url.pathname + url.search,
  );

  const robots = await page
    .locator('meta[name="robots"]')
    .first()
    .getAttribute("content");
  check("login is noindex", Boolean(robots?.includes("noindex")), robots ?? "");
  await page.screenshot({ path: `${OUT}/20-login.png` });

  await page.getByLabel("Email").fill("nadie@example.com");
  await page.getByLabel("Contraseña", { exact: true }).fill("incorrecta");
  await page.getByRole("button", { name: "Mostrar contraseña" }).click();
  check(
    "show password",
    (await page
      .getByLabel("Contraseña", { exact: true })
      .getAttribute("type")) === "text",
  );
  await page.getByRole("button", { name: "Ingresar" }).click();
  // Next also renders an (empty) role="alert" route announcer: target ours.
  const alert = page
    .getByRole("alert")
    .filter({ hasText: "No se pudo iniciar sesión" });
  await alert.waitFor();
  check(
    "generic error message",
    (await alert.innerText()).includes(
      "El email o la contraseña no son correctos.",
    ),
  );
  check(
    "email kept after error",
    (await page.getByLabel("Email").inputValue()) === "nadie@example.com",
  );
  await page.screenshot({ path: `${OUT}/21-login-error.png` });

  check(
    "no console errors (login)",
    errors.length === 0,
    errors.join(" | ").slice(0, 300),
  );

  const mobile = await newPage({ width: 390, height: 844 });
  await mobile.page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
  await mobile.page.screenshot({
    path: `${OUT}/22-login-mobile.png`,
    fullPage: true,
  });
}

// ---------------------------------------------------------- with session
if (!E2E_EMAIL || !E2E_PASSWORD) {
  console.log(
    "\n(skip) logged-in checks: create .env.e2e with E2E_EMAIL and E2E_PASSWORD",
  );
} else {
  const { context, page, errors } = await newPage({ width: 1280, height: 900 });
  await page.goto(`${BASE}/admin/login?next=/admin?estado=todos`, {
    waitUntil: "networkidle",
  });
  await page.getByLabel("Email").fill(E2E_EMAIL);
  await page.getByLabel("Contraseña", { exact: true }).fill(E2E_PASSWORD);
  await page.getByLabel("Mantener la sesión iniciada").uncheck();
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL((u) => u.pathname === "/admin");
  check(
    "login redirects to ?next",
    page.url().endsWith("/admin?estado=todos"),
    page.url(),
  );

  const authCookies = (await context.cookies()).filter((c) =>
    c.name.startsWith("sb-"),
  );
  check(
    "'Mantener la sesión' off → session cookies",
    authCookies.length > 0 && authCookies.every((c) => c.expires === -1),
    authCookies.map((c) => `${c.name}:${c.expires}`).join(", "),
  );
  check(
    "auth cookies are not readable… only by same site",
    authCookies.every((c) => c.sameSite === "Lax"),
  );

  await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
  check(
    "login redirects to /admin when signed in",
    new URL(page.url()).pathname === "/admin",
  );

  const heading = page.getByRole("heading", { name: "Mis componentes" });
  await heading.waitFor();
  const rows = page.locator("main li");
  const total = await rows.count();
  check("lists all products (incl. no stock)", total >= 1, `${total} rows`);
  check(
    "summary",
    /publicaci(ón|ones) · \d+ unidad/.test(
      await page.locator("main p").first().innerText(),
    ),
  );
  check(
    "sold-out label",
    (await page.getByText("Sin stock · oculto").count()) >= 1,
  );
  await page.screenshot({ path: `${OUT}/23-admin-list.png`, fullPage: true });

  // Search (accent-insensitive) + tabs
  await page.getByLabel("Buscar componentes").fill("rigido");
  await page.getByLabel("Buscar componentes").press("Enter");
  await page.waitForURL(/q=rigido/);
  await page.waitForLoadState("networkidle");
  check(
    "search by title without accents",
    (await rows.count()) === 1 &&
      (await rows.first().innerText()).includes("rígido"),
  );

  await page.goto(`${BASE}/admin?estado=sin-stock`, {
    waitUntil: "networkidle",
  });
  const soldOutRows = await rows.count();
  check(
    "tab: Sin stock",
    soldOutRows >= 1 &&
      (await page.getByText("En venta", { exact: true }).count()) === 0,
  );
  const tab = page.getByRole("link", { name: /Sin stock/ });
  check(
    "active tab marked",
    (await tab.getAttribute("aria-current")) === "page",
  );

  // Optimistic stock + persistence, then restore
  const row = rows.first();
  const title = (await row.locator("span.truncate").innerText()).trim();
  await row.getByRole("button", { name: "Sumar uno" }).click();
  check(
    "optimistic: status flips to En venta",
    await row.getByText("En venta").isVisible(),
  );
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
  await page.goto(`${BASE}/admin?q=${encodeURIComponent(title)}`, {
    waitUntil: "networkidle",
  });
  const updated = rows.first();
  check(
    "stock persisted",
    (
      await updated.getByRole("group", { name: /Stock de/ }).innerText()
    ).includes("1"),
  );
  await updated.getByRole("button", { name: "Restar uno" }).click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
  await page.reload({ waitUntil: "networkidle" });
  check(
    "stock restored to 0",
    await rows.first().getByText("Sin stock · oculto").isVisible(),
  );

  // Delete dialog (open / Esc / cancel — no deletion)
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  const trash = rows.first().getByRole("button", { name: /^Eliminar / });
  await trash.click();
  const dialog = page.getByRole("alertdialog", {
    name: "¿Eliminar este componente?",
  });
  await dialog.waitFor();
  await page.waitForTimeout(300);
  check(
    "dialog focuses Cancelar",
    await page.evaluate(
      () => document.activeElement?.textContent === "Cancelar",
    ),
  );
  await page.screenshot({ path: `${OUT}/24-admin-delete-dialog.png` });
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "detached" });
  check("Esc closes the dialog", true);
  check(
    "focus back on trash button",
    await trash.evaluate((el) => el === document.activeElement),
  );

  // Mobile layout
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: `${OUT}/25-admin-list-mobile.png`,
    fullPage: true,
  });

  // Logout
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await page.waitForURL((u) => u.pathname === "/admin/login");
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  check(
    "logout ends the session",
    new URL(page.url()).pathname === "/admin/login",
  );

  check(
    "no console errors (panel)",
    errors.length === 0,
    errors.join(" | ").slice(0, 400),
  );
}

await browser.close();
const failed = results.filter((ok) => !ok).length;
console.log(failed ? `\n${failed} check(s) failed` : "\nALL OK");
process.exit(failed ? 1 : 0);
