import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    // Aumentar timeout para testes de performance e integração
    testTimeout: 600000, // 10 minutos para testes de integração
    hookTimeout: 60000, // 1 minuto para hooks
    // ✅ Configurar pool para evitar OOM em Workers
    // Usar forks com execução mais conservadora
    pool: "forks",
    poolOptions: {
      forks: {
        // ✅ Ajustar dinamicamente baseado em CI ou local
        maxForks: process.env.CI ? 2 : 1,
        minForks: 1,
        singleFork: !process.env.CI, // Single fork apenas localmente
      },
    },
    // ✅ Ajustar concorrência baseado em ambiente
    maxConcurrency: process.env.CI ? 5 : 1,
    // ✅ Isolar testes no CI para melhor confiabilidade
    isolate: process.env.CI ? true : false,
    // ✅ Suporte a sharding para execução paralela
    // Use --shard=1/4 --shard=2/4 etc nos comandos
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
