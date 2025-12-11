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
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 2, // Reduzir para 2 workers (menos memória)
        minForks: 1,
        singleFork: true // Forçar um fork por vez para testes pesados
      }
    },
    // ✅ Controlar execução sequencial de testes pesados
    maxConcurrency: 3, // Reduzir para 3 testes simultâneos
    include: ["src/**/*.{test,spec}.{ts,tsx}", "api/**/*.{test,spec}.{ts,tsx}"],
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
