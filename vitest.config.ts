import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // @ts-expect-error - Vitest pode resolver tipos de Vite via dependência interna,
  // gerando incompatibilidade de tipos (PluginOption) apesar de funcionar em runtime.
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    // Aumentar timeout para testes de performance e integração
    testTimeout: 600000, // 10 minutos para testes de integração
    hookTimeout: 60000, // 1 minuto para hooks
    // Configuração de pool para estabilidade (modo manutenção)
    // Objetivo: executar em worker único e reutilizado, evitando flakiness de lifecycle do tinypool
    // (ex.: "Worker exited unexpectedly" no final da suíte).
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true,
        minThreads: 1,
        maxThreads: 1,
        // Reutiliza o mesmo worker entre arquivos para reduzir churn de criação/encerramento.
        isolate: false,
      },
    },
    // Rodar de forma sequencial para maximizar determinismo
    maxConcurrency: 1,
    fileParallelism: false,
    isolate: false,
    // ✅ Suporte a sharding para execução paralela
    // Use --shard=1/4 --shard=2/4 etc nos comandos
    // Este config é voltado ao frontend (React + JSDOM).
    // Testes de API/integração rodam em ambiente Node via vitest.config.node.ts.
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.{git,cache,output,temp}/**",
      "api/**",
      "tests/integration/**",
      // Testes locais que sobem servidor real devem ser executados via scripts dedicados
      "**/*.local-e2e.test.ts",
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
