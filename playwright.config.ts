import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  reporter: [["html", { open: "never" }]],
  // Inicia servidor de desenvolvimento para evitar 404 quando BASE_URL não aponta para produção
  webServer:
    process.env.BASE_URL || process.env.USE_PROD_BASE_URL
      ? undefined
      : {
          command: "npm run dev",
          port: 5173,
          reuseExistingServer: true,
          timeout: 60_000,
        },
  use: {
    // Preferir ambiente local por padrão para maior estabilidade dos seletores.
    // Permite sobrescrever via BASE_URL ou setando USE_PROD_BASE_URL=true
    baseURL:
      process.env.BASE_URL ||
      (process.env.USE_PROD_BASE_URL
        ? "https://assistente-juridico-p.vercel.app"
        : "http://127.0.0.1:5173"),
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    browserName: "chromium",
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
