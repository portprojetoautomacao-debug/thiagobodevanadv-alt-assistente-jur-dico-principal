import { defineConfig, devices } from "@playwright/test";
import fs from "fs";

const PORT = process.env.PORT || "5173";
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;
const USE_PROD = process.env.USE_PROD_BASE_URL === "true";
const IS_CI = process.env.CI === "true" || !!process.env.GITHUB_ACTIONS;

export default defineConfig({
  testDir: "tests/e2e",
  // Use path (string) for ESM compatibility
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 60_000,
  fullyParallel: true,
  reporter: [["html", { open: "never" }], ["list"]],
  // Inicia servidor de desenvolvimento automaticamente
  webServer: USE_PROD
    ? undefined
    : {
        command: `npm run dev -- --port ${PORT} --host 127.0.0.1`,
        url: `http://127.0.0.1:${PORT}`,
        reuseExistingServer: !IS_CI,
        timeout: 120_000,
        stdout: "pipe",
        stderr: "pipe",
      },
  use: {
    // Preferir ambiente local por padrão para maior estabilidade dos seletores.
    // Permite sobrescrever via BASE_URL ou setando USE_PROD_BASE_URL=true
    baseURL: USE_PROD ? "https://assistente-juridico-p.vercel.app" : BASE_URL,
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    // Sempre usar headless: true em dev containers sem servidor X11 (Linux, CI, Codespaces, etc).
    // Para debug local com interface gráfica, execute: npx playwright test --headed
    headless: true,
    storageState: fs.existsSync("tests/e2e/storageState.json")
      ? "tests/e2e/storageState.json"
      : undefined,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
