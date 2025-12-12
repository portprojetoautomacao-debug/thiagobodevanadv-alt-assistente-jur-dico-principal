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
    // Configuração de pool para estabilidade
    // Em alguns ambientes (Node 22 + worker_threads), vimos ERR_WORKER_OUT_OF_MEMORY.
    // Usar "forks" reduz o risco de estouro de heap em Workers.
    pool: "forks",
    poolOptions: {
      forks: {
        minForks: 1,
        maxForks: process.env.CI ? 2 : 1,
        // Garantir que os processos filhos usem o mesmo limite/flags do V8.
        // Isso reduz a chance de o worker terminar inesperadamente por heap padrão.
        execArgv: ["--max-old-space-size=8192", "--expose-gc"],
      },
    },
    // Ajustar concorrência baseado em ambiente para estabilidade
    maxConcurrency: process.env.CI ? 3 : 1,
    // ✅ Isolar arquivos de teste para melhor confiabilidade
    // Em execuções locais e CI, isso reduz vazamento de estado entre arquivos.
    isolate: true,
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
    // reporters will be handled via a separate converter script (vitest json -> SARIF)
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
