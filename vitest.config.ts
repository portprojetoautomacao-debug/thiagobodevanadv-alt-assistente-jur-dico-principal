import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    // Aumentar timeout para testes de performance
    testTimeout: 30000, // 30 segundos
    hookTimeout: 30000,
    // ✅ Configurar pool para evitar OOM em Workers
    // Usar forks com execução mais conservadora
    pool: "forks",
    poolOptions: {
      forks: {
        maxForks: 1, // ✅ Apenas 1 worker por vez (mais lento mas estável)
        minForks: 1,
        singleFork: true,
      },
    },
    // ✅ Forçar execução sequencial (evitar concorrência)
    maxConcurrency: 1,
    // ✅ Não isolar testes (economizar memória)
    isolate: false,
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "api/**/*.{test,spec}.{ts,tsx}",
      "tests/integration/**/*.test.ts",
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.{git,cache,output,temp}/**",
      "tests/e2e/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/test/", "**/*.d.ts", "**/*.config.*", "**/mockData", "dist/"],
    },
    // Configurar para usar .env.test
    env: {
      NODE_ENV: "test",
      VITEST: "true",
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
