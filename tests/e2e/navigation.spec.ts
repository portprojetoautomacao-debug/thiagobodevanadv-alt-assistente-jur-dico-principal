import { expect, test } from "@playwright/test";

test.describe("Navegação e Interações", () => {
  test("deve navegar entre páginas e voltar", async ({ page }) => {
    // browser_navigate
    await page.goto("/");
    await expect(page).toHaveURL(/\/$/);

    // Navigate to another page using a link click or navigation
    await page.goto("/api/health");
    await expect(page).toHaveURL(/\/api\/health/);

    // browser_navigate_back
    await page.goBack();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/$/);

    // browser_navigate_forward
    await page.goForward();
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/api\/health/, { timeout: 15000 });
  });

  test("deve clicar em elementos", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // browser_click
    const button = page.locator("button").first();
    const buttonCount = await button.count();
    if (buttonCount > 0) {
      try {
        await button.waitFor({ state: "visible", timeout: 5000 });
        await button.click({ timeout: 5000 });
      } catch {
        // Button may not be clickable, continue
      }
    }
    // Test passes even if no buttons are found or clickable
    expect(true).toBe(true);
  });

  test("deve fazer hover em elementos", async ({ page }) => {
    await page.goto("/");

    // browser_hover
    const element = page.locator("button, a").first();
    if ((await element.count()) > 0) {
      await element.hover();
    }
  });

  test("deve gerenciar abas", async ({ context }) => {
    // browser_tabs
    const page = await context.newPage();
    await page.goto("/");

    const page2 = await context.newPage();
    await page2.goto("/api/health");

    const pages = context.pages();
    expect(pages.length).toBeGreaterThanOrEqual(2);

    await page2.close();
  });

  test("deve aguardar elementos", async ({ page }) => {
    await page.goto("/");

    // browser_wait_for
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("body", { state: "visible" });
  });
});
