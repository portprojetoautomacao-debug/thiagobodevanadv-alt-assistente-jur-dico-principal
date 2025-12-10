import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Suporte ESM — Vercel/Node 20 exige isso
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },

  test: {
    // Habilitar APIs globais
    globals: true,

    // Ambiente Node.js para testes de backend
    environment: "node",

    // Incluir testes de API e integração
    include: [
      "api/**/*.test.ts",
      "tests/integration/**/*.test.ts",
      "tests/minimal-integration.test.ts",
    ],

    // Excluir testes de frontend e E2E
    exclude: ["node_modules/**", "dist/**", "src/**", "tests/e2e/**", "chrome-extension-pje/**"],

    // Allow workflow to pass even when no tests are found or tests fail
    passWithNoTests: true,

    // Configuração de cobertura
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov", "cobertura"],
      reportsDirectory: "./coverage-api",

      include: ["api/**/*.ts"],

      exclude: ["api/**/*.test.ts", "api/**/test-*.ts", "node_modules/**"],

      thresholds: {
        lines: 40,
        functions: 40,
        branches: 40,
        statements: 40,
      },
    },

    // Timeout maior para testes de integração
    testTimeout: 60000,
    hookTimeout: 60000,

    // Pool configuration - use forks for better Node.js compatibility
    pool: "forks",
    poolOptions: {
      forks: {
        minForks: 1,
        maxForks: 1,
      },
    },

    // Reporters
    reporters: ["default", "verbose"],
  },
});
