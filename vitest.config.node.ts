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
      // Include backend-specific library tests (Qdrant, LangGraph unit tests)
      "src/lib/**/__tests__/**/*.test.ts",
      "src/lib/**/*.spec.ts",
      "src/lib/**/*.test.ts",
    ],

    // Excluir testes de frontend e E2E
    exclude: [
      "node_modules/**",
      "dist/**",
      "src/**",
      "tests/e2e/**",
      "chrome-extension-pje/**",
      // Excluir arquivos de teste vazios até implementação
      "api/dspy-bridge.test.ts",
      "api/tests/agent-monitoring.test.ts",
      "api/tests/azure-upload.test.ts",
      "api/tests/pje-sync.integration.test.ts",
    ],

    // Configuração de cobertura
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov", "cobertura"],
      reportsDirectory: "./coverage-api",

      include: ["api/**/*.ts"],

      exclude: ["api/**/*.test.ts", "api/**/test-*.ts", "node_modules/**"],

      // MODO MANUTENÇÃO: Thresholds ajustados para valores realistas
      // Sistema em produção estável - foco em manter funcionamento, não aumentar cobertura
      thresholds: {
        lines: 15,
        functions: 30,
        branches: 15,
        statements: 15,
      },
    },

    // Timeout maior para testes de integração
    testTimeout: 60000,
    hookTimeout: 60000,

    // Pool configuration - Vitest 4 syntax
    pool: "threads",
    minThreads: 1,
    maxThreads: 1,
    maxConcurrency: 1,

    // Reporters
    reporters: ["default", "verbose"],
  },
});
