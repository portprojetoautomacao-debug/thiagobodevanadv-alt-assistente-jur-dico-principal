import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { VitePWA } from 'vite-plugin-pwa';

import { phosphorIconOptimizer } from './vite-icon-optimizer';
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    phosphorIconOptimizer(),
    // createIconImportProxy() as PluginOption, // REMOVIDO: depende de @github/spark
    // sparkPlugin() as PluginOption, // REMOVIDO: depende de @github/spark
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['robots.txt', 'sitemap.xml', '*.svg', '*.png'],
      manifest: {
        name: 'Assistente Jurídico PJe',
        short_name: 'PJe Assistant',
        description: 'Sistema inteligente de gestão jurídica com IA, monitoramento DJEN/DataJud e CRM de processos',
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
            purpose: 'any maskable'
          },
          {
            src: '/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/apis\.google\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'google-apis',
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 31536000 }
            }
          }
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/_/, /^\/api/]
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src'),
      '@doist/todoist-api-typescript': resolve(projectRoot, 'src/lib/todoist-stub.ts'),
      '@github/spark/llm': resolve(projectRoot, 'src/lib/llm-client.ts')
    }
  },
  optimizeDeps: {
    exclude: ['@doist/todoist-api-typescript']
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
    }
  },
  build: {
    cssMinify: 'lightningcss',
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    target: 'es2020', // Modern browsers only - reduz polyfills
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2,
        ecma: 2020, // Modern syntax compression
      },
      mangle: {
        safari10: true,
      },
      format: {
        ecma: 2020,
      },
    },
    rollupOptions: {
      output: {
        // Otimiza nomes de chunks para melhor caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks(id) {
          // React core - crítico, carrega primeiro
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }

          // ✅ CORREÇÃO: Recharts + D3 no mesmo chunk para evitar erro de inicialização
          // D3 é dependência do Recharts, precisam estar juntos
          if (id.includes('recharts') || id.includes('d3')) {
            return 'charts';
          }

          // Radix UI components - separar em chunks menores
          if (id.includes('@radix-ui')) {
            return 'ui-vendor';
          }

          // Form libraries - usado apenas em formulários
          if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform/resolvers')) {
            return 'forms';
          }

          // Phosphor icons - usado em toda app
          if (id.includes('@phosphor-icons/react')) {
            return 'icons';
          }

          // Framer Motion - lazy loaded
          if (id.includes('framer-motion')) {
            return 'animation';
          }

          // Three.js - lazy loaded, pesado
          if (id.includes('three')) {
            return 'three';
          }

          // DnD Kit (drag and drop para Kanban) - lazy loaded
          if (id.includes('@dnd-kit')) {
            return 'dnd';
          }

          // PDF e upload de arquivos - lazy loaded
          if (id.includes('pdf') || id.includes('file-upload')) {
            return 'files';
          }

          // Date utilities - usado frequentemente
          if (id.includes('date-fns')) {
            return 'date-utils';
          }

          // CSS utilities - crítico
          if (id.includes('clsx') || id.includes('class-variance-authority') || id.includes('tailwind-merge')) {
            return 'css-utils';
          }

          // Sentry - lazy loaded com delay
          if (id.includes('@sentry')) {
            return 'sentry';
          }

          // Sonner toasts - usado frequentemente
          if (id.includes('sonner')) {
            return 'toasts';
          }

          // Tiptap editor - lazy loaded
          if (id.includes('@tiptap')) {
            return 'editor';
          }

          // Sample data (usado apenas em desenvolvimento/demo)
          if (id.includes('sample-data')) {
            return 'sample-data';
          }
        }
      }
    },
    // Sourcemaps apenas em desenvolvimento
    sourcemap: false,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**'],
  },
});
