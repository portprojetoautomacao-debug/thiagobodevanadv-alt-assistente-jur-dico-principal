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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          
          // Radix UI components
          if (id.includes('@radix-ui')) {
            return 'ui-vendor';
          }
          
          // Charts libraries - temporarily disable separate chunk to avoid initialization issues
          // if (id.includes('recharts')) {
          //   return 'charts';
          // }
          
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
          
          // Other utilities
          if (id.includes('date-fns') || id.includes('clsx') || 
              id.includes('class-variance-authority') || id.includes('tailwind-merge')) {
            return 'utils';
          }
        }
      }
    },
    chunkSizeWarningLimit: 600,
  }
});
