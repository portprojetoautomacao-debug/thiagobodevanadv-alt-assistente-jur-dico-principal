import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

// Compatível com ESM (Node 20, Vercel, etc.)
const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',

    // Foca em testes de APIs (padrão Vercel /api)
    include: ['**/api/**/*.test.ts'],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'cobertura'],
      reportsDirectory: './coverage-api',
      // Opcional, mas útil pra não pegar lixo fora da API:
      include: ['**/api/**/*.ts'],
      exclude: ['**/api/**/*.test.ts'],
    },

    // Qualidade de vida em CI / local:
    passWithNoTests: true,
  },
})
