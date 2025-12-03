import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  // Use path (string) for ESM compatibility
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 60_000,
  fullyParallel: true,
  reporter: [["html", { open: "never" }]],
  // Inicia servidor de desenvolvimento para evitar 404 quando BASE_URL não aponta para produção.
  // Em CI e por padrão, inicia o servidor local a menos que USE_PROD_BASE_URL === 'true'.
  webServer: ((): any => {
    const useProd = process.env.USE_PROD_BASE_URL === "true";
    const isCI = process.env.CI === "true" || !!process.env.GITHUB_ACTIONS;
    // Se for para usar a base de produção explicitamente, não iniciamos o webServer local.
    if (useProd) return undefined;
    // Caso contrário, sempre iniciar o servidor local (inclusive em CI) para garantir disponibilidade.
    return {
      command: "npm run dev",
      env: { PORT: "5173" },
      port: 5173,
      reuseExistingServer: true,
      timeout: 60_000,
    };
  })(),
  use: {
    // Preferir ambiente local por padrão para maior estabilidade dos seletores.
    // Permite sobrescrever via BASE_URL ou setando USE_PROD_BASE_URL=true
    baseURL:
      process.env.BASE_URL ||
      (process.env.USE_PROD_BASE_URL === "true"
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
