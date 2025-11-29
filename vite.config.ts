// vite.config.ts

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

import { phosphorIconOptimizer } from './vite-icon-optimizer'

// Resolve robusto para ESM (funciona em Windows/Linux)
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const projectRoot = process.env.PROJECT_ROOT || __dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    phosphorIconOptimizer(),
    // createIconImportProxy() as PluginOption, // REMOVIDO: dependia de @github/spark
    // sparkPlugin() as PluginOption, // REMOVIDO: dependia de @github/spark
    VitePWA({
      registerType: 'autoUpdate',
      // ✅ FIX: Usar 'inline' ao invés do padrão para evitar problemas com CSP
      // O script de registro será injetado diretamente no HTML ao invés de arquivo separado
      injectRegister: 'inline',
      includeAssets: ['robots.txt', 'sitemap.xml', '*.svg', '*.png'],
      manifest: {
        name: 'Assistente Jurídico PJe',
        short_name: 'PJe Assistant',
        description:
          'Sistema inteligente de gestão jurídica com IA, monitoramento DJEN/DataJud e CRM de processos',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: '/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/apis\.google\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'google-apis',
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 31536000 },
            },
          },
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/_/, /^\/api/],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src'),
      // Stub local pro Todoist (evita dependência externa em runtime)
      '@doist/todoist-api-typescript': resolve(
        projectRoot,
        'src/lib/todoist-stub.ts',
      ),
      // REMOVIDO: @github/spark - agora usando Gemini 2.5 Pro diretamente
    },
  },
  optimizeDeps: {
    // Evita que o Vite tente pré-bundlar esse pacote (usa o stub)
    exclude: ['@doist/todoist-api-typescript'],
  },
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    headers: {
      // Permite usar window.open com preview de PDF / impressão sem quebrar tudo
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
  build: {
    cssMinify: 'lightningcss',
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
    // esbuild é mais previsível que terser em alguns ambientes serverless
    minify: 'esbuild',
    // Target focado em browsers modernos → menos polyfill
    target: 'es2020',
    rollupOptions: {
      output: {
        // Otimiza nomes de chunks para melhor caching em produção
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks(id) {
          // React core - crítico, carrega primeiro
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom')
          ) {
            return 'react-vendor'
          }

          // ⚠️ NÃO separar Recharts/D3 em chunks - pode causar erro de inicialização

          // Radix UI components - separar em chunks menores
          if (id.includes('@radix-ui')) {
            return 'ui-vendor'
          }

          // Form libraries - usado apenas em formulários
          if (
            id.includes('react-hook-form') ||
            id.includes('zod') ||
            id.includes('@hookform/resolvers')
          ) {
            return 'forms'
          }

          // Phosphor icons - usado em toda app
          if (id.includes('@phosphor-icons/react')) {
            return 'icons'
          }

          // Lucide icons - usado por shadcn/ui
          if (id.includes('lucide-react')) {
            return 'lucide-icons'
          }

          // Framer Motion - lazy loaded
          if (id.includes('framer-motion')) {
            return 'animation'
          }

          // Three.js - lazy loaded, pesado
          if (id.includes('three')) {
            return 'three'
          }

          // DnD Kit (drag and drop para Kanban) - lazy loaded
          if (id.includes('@dnd-kit')) {
            return 'dnd'
          }

          // PDF e upload de arquivos - lazy loaded
          if (id.includes('pdf') || id.includes('file-upload')) {
            return 'files'
          }

          // Date utilities - usado frequentemente
          if (id.includes('date-fns')) {
            return 'date-utils'
          }

          // CSS utilities - crítico
          if (
            id.includes('clsx') ||
            id.includes('class-variance-authority') ||
            id.includes('tailwind-merge')
          ) {
            return 'css-utils'
          }

          // Sentry - lazy loaded com delay
          if (id.includes('@sentry')) {
            return 'sentry'
          }

          // Sonner toasts - usado frequentemente
          if (id.includes('sonner')) {
            return 'toasts'
          }

          // Tiptap editor - lazy loaded
          if (id.includes('@tiptap')) {
            return 'editor'
          }

          // Sample data (apenas desenvolvimento/demo)
          if (id.includes('sample-data')) {
            return 'sample-data'
          }

          // default: deixa o Vite/rollup decidir
          return undefined
        },
      },
    },
    // Sourcemaps desligados em produção (pode ligar se quiser debugging remoto)
    sourcemap: false,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**'],
  },
})
