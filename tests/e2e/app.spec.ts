import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { fileURLToPath } from "node:url";

const collectionFile = fileURLToPath(
  new URL("../fixtures/collection.synthetic.json", import.meta.url),
);
const wishlistFile = fileURLToPath(
  new URL("../fixtures/wishlist.synthetic.json", import.meta.url),
);
const appPath = "/beyblade-x-scorebook/";

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
  await expect(page.getByRole("columnheader", { name: "Line" })).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Line" }),
  ).toHaveAttribute("aria-sort", "none");
  await page.getByRole("button", { name: "Sort by Line" }).click();
  await expect(
    page.getByRole("columnheader", { name: "Line" }),
  ).toHaveAttribute("aria-sort", "ascending");
  await page.getByRole("button", { name: "Sort by Line" }).click();
  await expect(
    page.getByRole("columnheader", { name: "Line" }),
  ).toHaveAttribute("aria-sort", "descending");
  await expect(
    page.getByRole("button", { name: "Sort by Part" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sort by Abbrev." }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Sort by Qty" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sort by Source" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("columnheader", { name: "Category" }),
  ).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "Type" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sort by Type" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sort by Type" }).click();
  await expect(
    page.getByRole("columnheader", { name: "Type" }),
  ).toHaveAttribute("aria-sort", "ascending");
  const lineFilter = page.getByRole("combobox", {
    name: "Filter blades by line",
  });
  const bladeTypeFilter = page.getByRole("combobox", {
    name: "Filter blades by type",
  });
  await expect(lineFilter).toBeVisible();
  await expect(lineFilter.locator("option")).toHaveText([
    "All Line",
    "BX",
    "UX",
    "CX",
  ]);
  await expect(bladeTypeFilter.locator("option")).toHaveText([
    "All Type",
    "Attack",
    "Defense",
    "Stamina",
    "Balance",
  ]);
  await expect(page.getByLabel("BX Expand / Infinity")).toHaveCSS(
    "color",
    "rgb(20, 121, 167)",
  );
  await expect(page.getByLabel("UX", { exact: true })).toHaveCSS(
    "color",
    "rgb(194, 65, 12)",
  );
  await expect(page.getByLabel("CX", { exact: true })).toHaveCSS(
    "color",
    "rgb(162, 28, 175)",
  );
  await lineFilter.selectOption("BX");
  await expect(page.getByRole("cell", { name: "Dran Strike" })).toBeVisible();
  const expandLine = page.getByRole("cell").getByLabel("BX Expand / Infinity");
  await expect(expandLine).toHaveText("BX∞");
  await expect(page.getByRole("cell", { name: /Fang.*尖牙/ })).toHaveCount(0);
  await lineFilter.selectOption("");
  await bladeTypeFilter.selectOption("Stamina");
  await expect(page.getByRole("cell", { name: "Wizard Rod" })).toBeVisible();
  await expect(page.getByRole("cell", { name: /Fang.*尖牙/ })).toHaveCount(0);
  await bladeTypeFilter.selectOption("");
  await page.getByPlaceholder("Search part name or abbreviation").fill("尖牙");
  await expect(page.getByRole("cell", { name: /Fang.*尖牙/ })).toBeVisible();
  await page.getByText("尖牙", { exact: true }).hover();
  await expect(page.getByRole("tooltip")).toContainText("EN-JP (TT): Fang");
  await expect(page.getByRole("tooltip")).toContainText("台灣中文: 獠牙");
  await page.getByText("Set One; Set Two; Set Three; ...").hover();
  await expect(page.getByRole("tooltip")).toHaveText(
    "Set One; Set Two; Set Three; Set Four",
  );
  await page.getByRole("button", { name: "Clear search" }).click();
  await page.getByRole("tab", { name: "Assist Blade" }).click();
  await expect(page.getByRole("columnheader", { name: "Line" })).toHaveCount(0);
  await expect(
    page.getByRole("columnheader", { name: "Category" }),
  ).toHaveCount(0);
  await expect(page.getByRole("cell", { name: "Turn" })).toBeVisible();
  await page.getByRole("cell", { name: "Turn", exact: true }).hover();
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await expect(
    page.getByRole("cell", { name: "2", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Others" }).click();
  await expect(
    page.getByRole("columnheader", { name: "Category" }),
  ).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Line" })).toHaveCount(0);
  await page.getByRole("tab", { name: "Bit", exact: true }).click();
  await expect(lineFilter).toHaveCount(0);
  await expect(bladeTypeFilter).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "Type" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sort by Type" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sort by Type" }).click();
  await expect(
    page.getByRole("columnheader", { name: "Type" }),
  ).toHaveAttribute("aria-sort", "ascending");
  await expect(page.getByRole("cell", { name: "Balance" })).toBeVisible();
  const bitTypeFilter = page.getByRole("combobox", {
    name: "Filter bits by type",
  });
  await expect(bitTypeFilter.locator("option")).toHaveText([
    "All Type",
    "Attack",
    "Defense",
    "Stamina",
    "Balance",
  ]);
  await bitTypeFilter.selectOption("Attack");
  await expect(page.getByRole("cell", { name: "Flat" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Left Right" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("collection.synthetic.json")).toBeVisible();
  await expect(page.getByText("wishlist.synthetic.json")).toBeVisible();
  await page.getByRole("link", { name: "Purchase" }).click();
  await expect(page.getByText(/123\.30/)).toBeVisible();
  await expect(page.getByText(/28\.65/).first()).toBeVisible();
  await expect(page.getByText(/Sold: Sold Bey/)).toBeVisible();
  await expect(page.getByText(/Returned: Returned Bey/)).toBeVisible();
  await expect(page.getByText(/Gifted: Gifted Bey/)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Trade History" }),
  ).toBeVisible();
  await expect(page.getByText("Even trade")).toBeVisible();
  await expect(page.getByText(/Traded: Fang Leon.*Fang Leon/)).toBeVisible();
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
  const inventoryAccessibility = await new AxeBuilder({ page })
    .withRules(["color-contrast"])
    .analyze();
  expect(inventoryAccessibility.violations).toEqual([]);
  await expect(
    page.getByRole("tablist", { name: "Inventory part categories" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Clip Lock" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Over Blade" })).toBeFocused();
});
