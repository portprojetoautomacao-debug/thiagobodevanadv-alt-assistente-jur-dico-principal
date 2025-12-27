import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

// Resolve seguro para ESM (funciona no Vercel, Windows e Linux)
const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },

  test: {
    // Garante consistência com Jest-like APIs
    globals: true,

    // Ambiente Node é ideal para testar APIs da pasta /api do Vercel
    environment: 'node',

    // Variáveis de ambiente para testes
    env: {
      ENABLE_HYBRID_AGENTS: 'true',
      LANGGRAPH_API_URL: 'http://localhost:8000',
      AUTOGEN_API_KEY: 'test-autogen-key',
      RESEND_API_KEY: 're_test_key_123',
      GEMINI_API_KEY: 'test-gemini-key',
      NODE_ENV: 'test',
    },

    // Testes localizados somente na pasta /api
    include: ['api/**/*.test.ts'],

    // Cobertura de código v8 (mais moderna)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],

      // Inclui apenas código relevante das APIs
      include: ['api/**/*.ts'],

      // Evita misturar testes com código avaliado
      exclude: ['api/**/*.test.ts'],
    },

    // Melhor estabilidade ao rodar em cloud runners
    isolate: false,
    watch: false,
    passWithNoTests: true, // Evita falha quando ainda não há testes
  },
})
