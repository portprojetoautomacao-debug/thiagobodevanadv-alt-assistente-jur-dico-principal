const { defineConfig, devices } = require( "@playwright/test" );
const fs = require( "fs" );
const envPort = process.env.PORT || "5173";

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig( {
  testDir: "tests/e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL:
      process.env.BASE_URL ||
      ( process.env.USE_PROD_BASE_URL === "true"
        ? "https://assistente-juridico-p.vercel.app"
        : `http://127.0.0.1:${ envPort }` ),

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Add the Vercel Protection Bypass header */
    extraHTTPHeaders: {
      "x-vercel-protection-bypass":
        process.env.VERCEL_AUTOMATION_BYPASS_SECRET || "",
    },
    storageState: fs.existsSync( "tests/e2e/storageState.json" )
      ? "tests/e2e/storageState.json"
      : undefined,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
  webServer: ( () =>
  {
    const envPort = process.env.PORT || "5173";
    const useProd = process.env.USE_PROD_BASE_URL === "true";
    const isCI = process.env.CI === "true" || !!process.env.GITHUB_ACTIONS;
    if ( useProd ) return undefined;
    return {
      command: "npm run dev:local",
      env: { PORT: envPort, HOST: "127.0.0.1", CI: isCI ? "true" : "false" },
      port: Number( envPort ),
      reuseExistingServer: true,
      timeout: 120_000,
      cwd: process.cwd(),
    };
  } )(),
} );
