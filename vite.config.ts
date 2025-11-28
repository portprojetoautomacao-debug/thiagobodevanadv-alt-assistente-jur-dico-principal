import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";
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
        manualChunks(id) {
          // React core
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }

          // Radix UI components - separar em chunks menores
          if (id.includes('@radix-ui')) {
            return 'ui-vendor';
          }

          // D3 separately to avoid conflicts
          if (id.includes('d3')) {
            return 'd3-vendor';
          }

          // Form libraries
          if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform/resolvers')) {
            return 'forms';
          }

          // Phosphor icons
          if (id.includes('@phosphor-icons/react')) {
            return 'icons';
          }

          // Framer Motion
          if (id.includes('framer-motion')) {
            return 'animation';
          }

          // Three.js
          if (id.includes('three')) {
            return 'three';
          }

          // Recharts (gráficos) - chunk separado REMOVIDO para evitar ReferenceError
          // if (id.includes('recharts')) {
          //   return 'charts';
          // }

          // DnD Kit (drag and drop para Kanban)
          if (id.includes('@dnd-kit')) {
            return 'dnd';
          }

          // PDF e upload de arquivos
          if (id.includes('pdf') || id.includes('file-upload')) {
            return 'files';
          }

          // Other utilities
          if (id.includes('date-fns') || id.includes('clsx') ||
            id.includes('class-variance-authority') || id.includes('tailwind-merge')) {
            return 'utils';
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
