import { chromium, FullConfig } from "@playwright/test";
import path from "path";

async function globalSetup(config: FullConfig) {
  // Any global setup can go here (programmatic login + storageState)
  console.log("🚀 Starting E2E tests...");

  const projectRoot = config.rootDir || process.cwd();
  const storagePath = path.join(projectRoot, "tests/e2e/storageState.json");

  // Usar credenciais padrão se não configuradas (para modo simple auth)
  const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || "adm";
  const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || "adm123";
  const baseURL = process.env.BASE_URL || "http://127.0.0.1:5173";
  const authMode = process.env.VITE_AUTH_MODE || "simple";

  // Apenas pular se estiver em modo google e sem credenciais
  if (authMode === "google" && (!process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD)) {
    console.warn(
      "⚠️ Google auth mode requires TEST_USER_EMAIL and TEST_USER_PASSWORD. Skipping login storageState creation."
    );
    return;
  }

  console.log(`📧 Using test credentials: ${TEST_USER_EMAIL} (mode: ${authMode})`);
  console.log(`🌐 Base URL: ${baseURL}`);
  console.log(`💾 Storage path: ${storagePath}`);

  // Em modo simple, usar credenciais padrão
  if (authMode === "simple") {
    console.log("✅ Simple auth mode - using default credentials (adm/adm123)");
  }

  try {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log("🔐 Attempting login...");
    await page.goto(`${baseURL}/login`, { waitUntil: "networkidle" });

    // Aguardar campos de login aparecerem
    await page.waitForSelector(
      'input[name="email"], input[type="email"], input[placeholder*="email" i]',
      { timeout: 10_000 }
    );

    // Preencher formulário de login
    const emailInput = page
      .locator('input[name="email"], input[type="email"], input[placeholder*="email" i]')
      .first();
    const passwordInput = page
      .locator(
        'input[name="password"], input[type="password"], input[placeholder*="senha" i], input[placeholder*="password" i]'
      )
      .first();

    await emailInput.fill(TEST_USER_EMAIL);
    await passwordInput.fill(TEST_USER_PASSWORD);

    console.log(`✏️ Filled credentials for ${TEST_USER_EMAIL}`);

    // Clicar em submit
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click({ timeout: 10_000 });

    console.log("⏳ Waiting for navigation...");

    // Wait for navigation to dashboard or authenticated route
    await page.waitForURL("**/dashboard", { timeout: 15_000 }).catch(async () => {
      console.log("Dashboard URL not detected, checking for auth indicators...");
      // fallback wait for any auth badge / avatar or main content
      await page
        .waitForSelector(
          '[data-test="user-avatar"], .avatar, [aria-label="account"], [data-testid="sidebar-nav"], main',
          { timeout: 10_000 }
        )
        .catch(() => {
          console.warn("Auth indicators not found, continuing anyway...");
          return null;
        });
    });

    await context.storageState({ path: storagePath });
    await browser.close();
    console.log(`✅ Storage state saved to ${storagePath}`);
  } catch (error) {
    console.warn("⚠️ Failed to create storage state during global setup:", error);
    console.log("ℹ️ Tests will run without pre-authenticated state.");
  }
}

export default globalSetup;
