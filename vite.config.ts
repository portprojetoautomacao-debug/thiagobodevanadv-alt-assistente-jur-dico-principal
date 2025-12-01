// vite.config.ts

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

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
          // ✅ REMOVIDO: Google Fonts cache rule
          // Fontes agora são hospedadas localmente em /public/fonts/
          // Isso elimina erros 404 do fonts.gstatic.com
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
    proxy: {
      // Proxy para APIs - desenvolvimento aponta para Vercel produção
      '/api': {
        target: 'https://assistente-juridico-github.vercel.app',
        changeOrigin: true,
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying request:', req.method, req.url, '->', proxyReq.getHeader('host') + proxyReq.path);
          });
        },
      },
      // Proxy para endpoints legados /_spark/* -> /api/*
      '/_spark/llm': {
        target: 'https://assistente-juridico-github.vercel.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/_spark\/llm/, '/api/llm-proxy'),
      },
      '/_spark/kv': {
        target: 'https://assistente-juridico-github.vercel.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/_spark\/kv/, '/api/kv'),
      },
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

          // ✅ FIX: Phosphor Icons no bundle principal para evitar "Cannot set properties of undefined (setting 'Activity')"
          // O erro acontece quando chunks diferentes tentam acessar ícones antes da inicialização
          if (id.includes('@phosphor-icons/react')) {
            return 'react-vendor'
          }

          // ⚠️ NÃO separar Recharts/D3 em chunks - pode causar erro de inicialização

          // Radix UI components - separar em chunks menores
          if (id.includes('@radix-ui')) {
            return 'ui-vendor'
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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '*.config.ts',
        '*.config.js',
        'src/test/**',
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
      ],
    },
  },
})
