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
    // PWA desabilitado temporariamente devido a conflito com @doist/todoist-api-typescript
    // Será reativado após migrar Todoist para server-side only
    // VitePWA({ ... })
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src'),
      '@doist/todoist-api-typescript': resolve(projectRoot, 'src/lib/todoist-stub.ts')
    }
  },
  optimizeDeps: {
    exclude: ['@doist/todoist-api-typescript']
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
