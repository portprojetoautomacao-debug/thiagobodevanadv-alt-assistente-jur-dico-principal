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
    
    // Diferentes environments para diferentes tipos de teste
    environment: 'node', // padrão para API tests
    
    // Configuração específica por arquivo
    environmentMatchGlobs: [
      // Componentes React precisam de jsdom
      ['**/src/components/**/*.test.{ts,tsx}', 'jsdom'],
      // Testes de lib podem usar node
      ['**/src/lib/**/*.test.ts', 'node'],
      // API sempre usa node
      ['**/api/**/*.test.ts', 'node'],
    ],

    // Inclui testes de APIs E testes de lib/components
    include: [
      '**/api/**/*.test.ts',
      '**/src/**/*.test.{ts,tsx}'
    ],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'cobertura'],
      reportsDirectory: './coverage',
      // Inclui API e src para cobertura completa
      include: ['**/api/**/*.ts', '**/src/**/*.{ts,tsx}'],
      exclude: [
        '**/api/**/*.test.ts',
        '**/src/**/*.test.{ts,tsx}',
        '**/src/components/ui/**', // shadcn components (não modificar)
        '**/node_modules/**'
      ],
    },

    // Qualidade de vida em CI / local:
    passWithNoTests: true,
  },
})
