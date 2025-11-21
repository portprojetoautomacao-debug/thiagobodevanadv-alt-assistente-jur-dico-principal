import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";

import sparkPlugin from "@github/spark/spark-vite-plugin";
import createIconImportProxy from "@github/spark/vitePhosphorIconProxyPlugin";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // DO NOT REMOVE
    // createIconImportProxy() as PluginOption,
    sparkPlugin() as PluginOption,
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
          
          // Recharts (gráficos) - chunk separado
          if (id.includes('recharts')) {
            return 'charts';
          }
          
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
    // Reduzir limite de warning para 500KB
    chunkSizeWarningLimit: 500,
    // Otimizações adicionais
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log em produção
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    // Sourcemaps apenas em desenvolvimento
    sourcemap: false,
  }
});
