import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },

  test: {
    // Habilitar APIs globais (describe, it, expect, etc.)
    globals: true,

    // Ambiente de teste para DOM (React components)
    environment: "happy-dom",

    // Setup files executados antes dos testes
    setupFiles: ["./src/test/setup.ts"],

    // Incluir apenas testes unitários do frontend
    include: ["src/**/*.{test,spec}.{ts,tsx}", "test-simple.test.ts"],

    // Excluir testes de API e E2E
    exclude: [
      "node_modules/**",
      "dist/**",
      ".next/**",
      "api/**",
      "tests/**",
      "chrome-extension-pje/**",
      "**/*.e2e.{test,spec}.{ts,tsx}",
      "**/e2e/**",
    ],

    // Configuração de cobertura
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov", "cobertura"],
      reportsDirectory: "./coverage",

      // Incluir na cobertura
      include: ["src/**/*.{ts,tsx}"],

      // Excluir da cobertura
      exclude: [
        "node_modules/**",
        "src/test/**",
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/**/__tests__/**",
        "src/types.ts",
        "src/vite-env.d.ts",
        "src/main.tsx",
        "dist/**",
        ".next/**",
      ],

      // Thresholds de cobertura (ajustáveis)
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50,
      },
    },

    // Configurações de performance
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4,
      },
    },

    // Timeout para testes (30 segundos)
    testTimeout: 30000,
    hookTimeout: 30000,

    // Watch mode configuration
    watch: true,
    watchExclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.test-results/**",
      "**/.copilot-notifications/**",
    ],

    // Reporter configuration
    reporters: ["default", "verbose"],

    // Mock configuration
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
  },
});
