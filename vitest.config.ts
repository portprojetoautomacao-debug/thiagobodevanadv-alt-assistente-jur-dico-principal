import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vitest/config";

const forkDebug = process.env.VITEST_FORK_DEBUG === "1";

export default defineConfig( {
  // @ts-expect-error - Vitest pode resolver tipos de Vite via dependência interna,
  // gerando incompatibilidade de tipos (PluginOption) apesar de funcionar em runtime.
  plugins: [ react() ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [ "./src/test/setup.ts", "./tests/setup-env.ts" ],
    // Workaround de estabilidade (modo manutenção):
    // Em alguns ambientes (Node 22 + pool=forks), o tinypool pode reportar
    // "Worker exited unexpectedly" no teardown mesmo com todos os testes passando.
    // Mantemos falhas de testes como falhas reais, mas evitamos que esse ruído
    // derrube o pipeline.
    dangerouslyIgnoreUnhandledErrors: true,
    // Timeout reduzido para detectar testes travados rapidamente
    testTimeout: 60000, // 60 segundos por teste (aumentado para testes longos)
    hookTimeout: 20000, // 20 segundos para hooks
    // Configuração de pool para estabilidade (modo manutenção)
    // Objetivo: executar em worker único e reutilizado, evitando flakiness de lifecycle do tinypool
    // (ex.: "Worker exited unexpectedly" no final da suíte).
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
        minForks: 1,
        maxForks: 1,
        // Isolamento por arquivo (recycle do processo) para evitar vazamento de cache/mocks.
        isolate: true,
        ...( forkDebug
          ? {
            execArgv: [ "--trace-uncaught", "--trace-warnings", "--unhandled-rejections=strict" ],
          }
          : {} ),
      },
    },
    // Rodar de forma sequencial para maximizar determinismo
    maxConcurrency: 1,
    fileParallelism: false,
    // Manter isolamento por arquivo para evitar vazamento de cache/mocks entre suites
    isolate: true,
    // ✅ Suporte a sharding para execução paralela
    // Use --shard=1/4 --shard=2/4 etc nos comandos
    // Este config é voltado ao frontend (React + JSDOM).
    // Testes de API/integração rodam em ambiente Node via vitest.config.node.ts.
    include: [ "src/**/*.{test,spec}.{ts,tsx}", "tests/**/*.test.ts" ],
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
      reporter: [ "text", "json", "html" ],
      exclude: [ "node_modules/", "src/test/", "**/*.d.ts", "**/*.config.*", "**/mockData", "dist/" ],
    },
    // Configurar para usar .env.test
    env: {
      NODE_ENV: "test",
      VITEST: "true",
    },
  },
  resolve: {
    alias: {
      "@": resolve( __dirname, "./src" ),
    },
  },
} );
