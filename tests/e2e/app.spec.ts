import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { fileURLToPath } from "node:url";

const collectionFile = fileURLToPath(
  new URL("../fixtures/collection.synthetic.json", import.meta.url),
);
const wishlistFile = fileURLToPath(
  new URL("../fixtures/wishlist.synthetic.json", import.meta.url),
);
const appPath = "/beyblade-x-scorebook/react.html";

async function open(page: Page, hash = "") {
  await page.goto(`${appPath}${hash}`);
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
}

async function loadCollection(page: Page) {
  await page.getByLabel("Collection JSON").setInputFiles(collectionFile);
  await expect(page.getByText("collection.synthetic.json")).toBeVisible();
}

async function loadWishlist(page: Page) {
  await page.getByLabel("Wishlist JSON").setInputFiles(wishlistFile);
  await expect(page.getByText("wishlist.synthetic.json")).toBeVisible();
}

test("uploads, restores, routes, and clears browser-only data", async ({
  page,
}) => {
  await open(page);
  await loadCollection(page);
  await loadWishlist(page);
  await page.getByRole("link", { name: "Inventory" }).click();
  await expect(page).toHaveURL(/#\/inventory$/);
  await page.getByRole("tab", { name: "Assist Blade" }).click();
  await expect(page.getByRole("cell", { name: "Turn" })).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "2", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText("collection.synthetic.json")).toBeVisible();
  await expect(page.getByText("wishlist.synthetic.json")).toBeVisible();
  await page.getByRole("link", { name: "Purchase" }).click();
  await expect(page.getByText(/123\.30/)).toBeVisible();
  await expect(page.getByText(/28\.65/).first()).toBeVisible();
  await expect(page.getByText(/Sold: Sold Bey/)).toBeVisible();
  await expect(page.getByText(/Returned: Returned Bey/)).toBeVisible();
  await expect(page.getByText(/Gifted: Gifted Bey/)).toBeVisible();
  await page.getByRole("button", { name: "Clear data" }).click();
  await expect(page.getByText("collection.synthetic.json")).toHaveCount(0);
  await expect(page.getByText("wishlist.synthetic.json")).toHaveCount(0);
});

test("filters and sorts the Catalogue and Wishlist", async ({ page }) => {
  await open(page, "#/catalogue");
  await expect(page.getByText(/of 125 listings/)).toBeVisible();
  await page
    .getByPlaceholder("Search products, configs, or retailer")
    .fill("Launcher Grip");
  await expect(page.getByText(/2 of 125 listings/)).toBeVisible();
  await expect(
    page
      .getByRole("link", { name: "BX-11 Launcher Grip Starter with launcher" })
      .first(),
  ).toBeVisible();
  await page.getByLabel("Sort catalogue").selectOption("priceAsc");
  await page.getByPlaceholder("Search products, configs, or retailer").fill("");
  await expect(page.getByText(/125 of 125 listings/)).toBeVisible();
  await loadWishlist(page);
  await page.getByRole("link", { name: "Wishlist" }).click();
  await page.getByLabel("Part full name or abbreviation").fill("LR");
  await expect(page.getByText(/1 of 3 items/)).toBeVisible();
  await page.getByRole("checkbox", { name: "Only missing parts" }).check();
  await expect(page.getByText(/0 of 3 items/)).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByText(/3 of 3 items/)).toBeVisible();
  await page.getByRole("button", { name: "List", exact: true }).click();
  await expect(
    page.getByRole("columnheader", { name: "Cost Index" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "List", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("scores CX products and renders shared Rules", async ({ page }) => {
  await open(page);
  const products = page.getByLabel(/Product or combo/);
  await products.nth(0).fill("Blast Pegasus A Tr");
  await products.nth(1).fill("");
  await page.getByLabel("Price").nth(0).fill("42.36");
  await page.getByLabel("CX mode").nth(0).check();
  await expect(
    page.getByRole("button", { name: /Blast Pegasus A Tr/ }),
  ).toContainText("7.5");
  await expect(
    page.getByRole("cell", { name: "Blast", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Tr", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Rules" }).click();
  await expect(page.getByText("Rank Score × Part Type Weight")).toBeVisible();
  await expect(
    page.getByText("Lower is better", { exact: false }),
  ).toBeVisible();
});

test("meets accessibility and responsive-navigation checks", async ({
  page,
}) => {
  await open(page);
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  const focusOutline = await page
    .getByRole("link", { name: "Skip to content" })
    .evaluate((element) => getComputedStyle(element).outlineStyle);
  expect(focusOutline).not.toBe("none");
  await expect(page.getByRole("main")).toBeAttached();
  await page.setViewportSize({ width: 390, height: 844 });
  const widths = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    viewport: window.innerWidth,
    nav: document.querySelector("nav")?.scrollWidth ?? 0,
    navClient: document.querySelector("nav")?.clientWidth ?? 0,
  }));
  expect(widths.body).toBeLessThanOrEqual(widths.viewport);
  expect(widths.nav).toBeGreaterThan(widths.navClient);
  await loadCollection(page);
  await open(page, "#/inventory");
  await expect(
    page.getByRole("tablist", { name: "Inventory part categories" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Clip Lock" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Over Blade" })).toBeFocused();
});
