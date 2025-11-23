/// <reference types="vitest" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";
import { VitePWA } from 'vite-plugin-pwa';

import sparkPlugin from "@github/spark/spark-vite-plugin";
import createIconImportProxy from "@github/spark/vitePhosphorIconProxyPlugin";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    createIconImportProxy() as PluginOption,
    sparkPlugin() as PluginOption,
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['robots.txt', 'sitemap.xml', '*.svg'],
      manifest: {
        name: 'Assistente Jurídico PJe - Gestão Inteligente',
        short_name: 'PJe Assistant',
        description: 'Sistema inteligente de gestão jurídica com IA, monitoramento DJEN/DataJud, 7 agentes autônomos e CRM de processos',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any'
          }
        ],
        categories: ['business', 'productivity', 'utilities'],
        screenshots: [
          {
            src: '/screenshot-wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide'
          },
          {
            src: '/screenshot-narrow.png',
            sizes: '640x1136',
            type: 'image/png',
            form_factor: 'narrow'
          }
        ]
      },
      workbox: {
        // Cache de recursos estáticos
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        
        // Configurações avançadas de cache
        runtimeCaching: [
          // APIs Google (OAuth, Calendar)
          {
            urlPattern: /^https:\/\/apis\.google\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'google-apis-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 horas
              },
              cacheKeyWillBeUsed: async ({ request }) => {
                return `${request.url}?version=${Date.now()}`
              }
            }
          },
          
          // API Todoist
          {
            urlPattern: /^https:\/\/api\.todoist\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'todoist-api-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 12 // 12 horas
              }
            }
          },
          
          // DJEN API
          {
            urlPattern: /^https:\/\/.*\.djen\.com\.br\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'djen-api-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 6 // 6 horas
              }
            }
          },
          
          // Recursos Spark
          {
            urlPattern: /^\/_spark\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'spark-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 2 // 2 horas
              }
            }
          },
          
          // CDN de fonts
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
              }
            }
          },
          
          // Font files
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
              }
            }
          }
        ],
        
        // Background sync para ações offline
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/_/, /^\/api/],
        
        // Configurações de skip waiting
        skipWaiting: true,
        clientsClaim: true
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  server: {
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
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2,
      },
      mangle: {
        safari10: true,
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
          
          // GitHub Spark
          if (id.includes('@github/spark')) {
            return 'spark';
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
