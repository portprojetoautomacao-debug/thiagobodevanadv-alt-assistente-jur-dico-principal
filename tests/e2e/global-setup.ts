import { chromium, FullConfig } from "@playwright/test";
import path from "path";

async function globalSetup(config: FullConfig) {
  // Any global setup can go here (programmatic login + storageState)
  console.log("🚀 Starting E2E tests...");

  const projectRoot = config.rootDir || process.cwd();
  const storagePath = path.join(projectRoot, "tests/e2e/storageState.json");

  const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
  const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;
  const baseURL = process.env.BASE_URL || "http://127.0.0.1:5173";

  if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
    console.warn(
      "⚠️ TEST_USER_EMAIL or TEST_USER_PASSWORD not set. Skipping login storageState creation."
    );
    return;
  }

  try {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', TEST_USER_EMAIL);
    await page.fill('input[name="password"]', TEST_USER_PASSWORD);
    await page
      .click('button[type="submit"][role="button"]', { timeout: 10_000 })
      .catch(async () => {
        // Try clicking generic submit
        await page
          .click('button[type="submit"]', { timeout: 10_000 })
          .catch(() => {});
      });
    // Wait for navigation to dashboard or authenticated route
    await page.waitForURL("**/dashboard", { timeout: 15_000 }).catch(() => {
      // fallback wait for any auth badge / avatar
      return page
        .waitForSelector(
          '[data-test="user-avatar"], .avatar, [aria-label="account"]',
          { timeout: 10_000 }
        )
        .catch(() => null);
    });
    await context.storageState({ path: storagePath });
    await browser.close();
    console.log(`✅ Storage state saved to ${storagePath}`);
  } catch (error) {
    console.warn(
      "⚠️ Failed to create storage state during global setup:",
      error
    );
  }
}

export default globalSetup;
/**
 * Global setup for Playwright E2E tests
 * This runs before all tests
 */

// chromium available for browser launch if needed
// import { chromium } from '@playwright/test';

async function globalSetup() {
  // Any global setup can go here
  console.log("🚀 Starting E2E tests...");
}

export default globalSetup;
