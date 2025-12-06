// vite.config.ts

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

import { phosphorIconOptimizer } from "./vite-icon-optimizer";

// Resolve robusto para ESM (funciona em Windows/Linux)
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = process.env.PROJECT_ROOT || __dirname;

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    phosphorIconOptimizer(),
    // createIconImportProxy() as PluginOption, // REMOVIDO: dependia de @github/spark
    // sparkPlugin() as PluginOption, // REMOVIDO: dependia de @github/spark
    VitePWA({
      registerType: "autoUpdate",
      // ✅ FIX: Usar 'inline' ao invés do padrão para evitar problemas com CSP
      // O script de registro será injetado diretamente no HTML ao invés de arquivo separado
      injectRegister: "inline",
      includeAssets: ["robots.txt", "sitemap.xml", "*.svg", "*.png"],
      manifest: {
        id: "/",
        name: "Assistente Jurídico PJe",
        short_name: "PJe Assistant",
        description:
          "Sistema inteligente de gestão jurídica com IA, monitoramento DJEN/DataJud e CRM de processos",
        theme_color: "#1e40af",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
        start_url: "/",
        screenshots: [
          {
            src: "/og-image.svg",
            sizes: "1200x630",
            type: "image/svg+xml",
            form_factor: "wide",
            label: "Assistente Jurídico Desktop",
          },
          {
            src: "/og-image.svg",
            sizes: "1200x630",
            type: "image/svg+xml",
            label: "Assistente Jurídico Mobile",
          },
        ],
        icons: [
          {
            src: "/icon-192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
          {
            src: "/icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        // 🔄 FORÇA ATUALIZAÇÃO: skipWaiting + clientsClaim para atualizar imediatamente
        skipWaiting: true,
        clientsClaim: true,
        // Limpar caches antigos automaticamente
        cleanupOutdatedCaches: true,
        // ✅ INCLUIR todos os chunks no precache (inclusive lazy-loaded)
        // O cleanupOutdatedCaches vai remover versões antigas automaticamente
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        // ❌ REMOVIDO globIgnores - chunks lazy devem ser precacheados
        // O problema de 404 acontecia porque chunks eram excluídos do cache
        // mas o SW interceptava a request e não encontrava no cache
        runtimeCaching: [
          {
            // ✅ Lazy-loaded chunks: NetworkFirst para sempre buscar versão atualizada
            // Se rede falhar, usa cache. Isso resolve o 404 de chunks com hash diferente
            urlPattern:
              /\/assets\/(MinutasManager|TiptapEditorV2|DashboardCharts|animation|three|dnd|files)-[a-zA-Z0-9]+\.js$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "lazy-chunks",
              expiration: { maxEntries: 20, maxAgeSeconds: 86400 * 7 }, // 7 dias
              networkTimeoutSeconds: 10, // Timeout rápido para fallback ao cache
            },
          },
          {
            urlPattern: /^https:\/\/apis\.google\.com\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "google-apis",
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
            },
          },
          // ✅ REMOVIDO: Google Fonts cache rule
          // Fontes agora são hospedadas localmente em /public/fonts/
          // Isso elimina erros 404 do fonts.gstatic.com
        ],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/_/, /^\/api/],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(projectRoot, "src"),
      // Stub local pro Todoist (evita dependência externa em runtime)
      "@doist/todoist-api-typescript": resolve(projectRoot, "src/lib/todoist-stub.ts"),
      // REMOVIDO: @github/spark - agora usando Gemini 2.5 Pro diretamente
    },
  },
  optimizeDeps: {
    // Evita que o Vite tente pré-bundlar esse pacote (usa o stub)
    exclude: ["@doist/todoist-api-typescript"],
  },
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    headers: {
      // Permite usar window.open com preview de PDF / impressão sem quebrar tudo
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
    proxy: {
      // Proxy para APIs - desenvolvimento aponta para Vercel produção
      "/api": {
        target: "https://assistente-juridico-github.vercel.app",
        changeOrigin: true,
        secure: true,
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("Proxy error:", err);
          });
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log(
              "Proxying request:",
              req.method,
              req.url,
              "->",
              proxyReq.getHeader("host") + proxyReq.path
            );
          });
        },
      },
      // Proxy para endpoints legados /_spark/* -> /api/*
      "/_spark/llm": {
        target: "https://assistente-juridico-github.vercel.app",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/_spark\/llm/, "/api/llm-proxy"),
      },
      "/_spark/kv": {
        target: "https://assistente-juridico-github.vercel.app",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/_spark\/kv/, "/api/kv"),
      },
    },
  },
  build: {
    cssMinify: "lightningcss",
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
    // esbuild é mais previsível que terser em alguns ambientes serverless
    minify: "esbuild",
    // Target focado em browsers modernos → menos polyfill
    target: "es2020",
    // ❌ DESABILITAR modulePreload para evitar race condition do ProseMirror
    // O erro "Cannot set properties of undefined (setting 'Activity')"
    // acontece quando editor-vendor é pré-carregado antes do React estar pronto
    modulePreload: {
      polyfill: true,
      // Não fazer preload de chunks que contêm ProseMirror/Tiptap
      resolveDependencies: (_filename, deps, { hostId: _hostId, hostType: _hostType }) => {
        // Filtrar dependências que não devem ser preloaded
        return deps.filter((dep) => {
          // Não preload editor chunks - eles serão carregados sob demanda
          if (dep.includes("editor") || dep.includes("tiptap") || dep.includes("prosemirror")) {
            return false;
          }
          // Não preload Minutas - lazy loaded
          if (dep.includes("Minutas") || dep.includes("minutas")) {
            return false;
          }
          return true;
        });
      },
    },
    rollupOptions: {
      // ✅ FIX: Desabilita hoisting de imports transitivos para evitar dependências circulares
      // O erro "Cannot set properties of undefined (setting 'Activity')" acontecia porque
      // o Rollup movia helpers como getDefaultExportFromCjs para chunks errados
      treeshake: {
        // Preserva imports transitivos nos chunks originais
        manualPureFunctions: [],
      },
      output: {
        // ✅ FIX: Não hoista imports transitivos entre chunks
        // Isso evita que react-vendor importe de editor-vendor
        hoistTransitiveImports: false,
        // Otimiza nomes de chunks para melhor caching em produção
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
        manualChunks(id) {
          // React core + Phosphor Icons - crítico, carrega primeiro
          // ✅ FIX: Phosphor Icons incluído aqui para evitar dependência circular
          // O erro "Cannot set properties of undefined (setting 'Activity')"
          // acontecia porque editor-vendor era importado antes do React estar pronto
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/scheduler") ||
            id.includes("@phosphor-icons/react")
          ) {
            return "react-vendor";
          }

          // ⚠️ REMOVIDO: editor-vendor separado causava dependência circular
          // Tiptap/ProseMirror agora é bundled naturalmente com MinutasManager (lazy)
          // Isso evita que react-vendor precise importar de editor-vendor

          // Radix UI components - separar em chunks menores
          if (id.includes("@radix-ui")) {
            return "ui-vendor";
          }

          // Framer Motion - lazy loaded
          if (id.includes("framer-motion")) {
            return "animation";
          }

          // Three.js - lazy loaded, pesado
          if (id.includes("three")) {
            return "three";
          }

          // DnD Kit (drag and drop para Kanban) - lazy loaded
          if (id.includes("@dnd-kit")) {
            return "dnd";
          }

          // PDF e upload de arquivos - lazy loaded
          if (id.includes("pdf") || id.includes("file-upload")) {
            return "files";
          }

          // Date utilities - usado frequentemente
          if (id.includes("date-fns")) {
            return "date-utils";
          }

          // CSS utilities - crítico
          if (
            id.includes("clsx") ||
            id.includes("class-variance-authority") ||
            id.includes("tailwind-merge")
          ) {
            return "css-utils";
          }

          // Sentry - lazy loaded com delay
          if (id.includes("@sentry")) {
            return "sentry";
          }

          // Sonner toasts - usado frequentemente
          if (id.includes("sonner")) {
            return "toasts";
          }

          // Sample data (apenas desenvolvimento/demo)
          if (id.includes("sample-data")) {
            return "sample-data";
          }

          // default: deixa o Vite/rollup decidir
          return undefined;
        },
      },
    },
    // Sourcemaps desligados em produção (pode ligar se quiser debugging remoto)
    sourcemap: false,
  },
  test: {
    globals: true,
    // ✅ jsdom como padrão para componentes React
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",

    // ✅ Incluir testes de API e src
    include: ["**/api/**/*.test.ts", "**/src/**/*.test.{ts,tsx}"],

    // ✅ Configuração específica por arquivo
    environmentMatchGlobs: [
      // API tests usam node environment
      ["**/api/**/*.test.ts", "node"],
      // Lib tests (sem DOM) podem usar node
      ["**/src/lib/**/*.test.ts", "node"],
    ],

    exclude: ["**/node_modules/**", "**/dist/**", "tests/e2e/**"],

    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      // ✅ Incluir API e src para cobertura
      include: ["**/api/**/*.ts", "**/src/**/*.{ts,tsx}"],
      exclude: [
        "node_modules/",
        "dist/",
        "tests/",
        "*.config.ts",
        "*.config.js",
        "src/test/**",
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "api/**/*.test.ts",
        "src/components/ui/**", // shadcn (não modificar)
      ],
    },

    // ✅ Passar sem testes OK (útil para CI)
    passWithNoTests: true,
  },
});
