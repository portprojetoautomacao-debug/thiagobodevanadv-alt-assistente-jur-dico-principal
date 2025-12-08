import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import App from "./App";
import { ErrorFallback } from "./ErrorFallback.tsx";

import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

// ⚠️ TRUSTED TYPES: DESABILITADO TEMPORARIAMENTE
// O vite-plugin-pwa gera registerSW.js que não é compatível com Trusted Types
// causando erro: "This document requires 'TrustedScriptURL' assignment"
// NOTA: Reabilitar quando o plugin PWA suportar Trusted Types nativamente
//
// import('./lib/trusted-types').then(({ initTrustedTypes }) => {
//   initTrustedTypes()
// }).catch(err => console.warn('Trusted Types não disponível:', err))

// ✅ ANALYTICS: GTM + GA4 inicialização (após consentimento se LGPD requerido)
// IDs configuráveis via VITE_GTM_ID e VITE_GA4_ID
let analyticsInitialized = false;

const initAnalyticsServices = () => {
  if (analyticsInitialized) return;
  analyticsInitialized = true;

  import("./lib/analytics")
    .then(({ initAnalytics }) => {
      // initAnalytics é síncrono - não precisa de await
      initAnalytics();
    })
    .catch((error) => {
      console.warn("Analytics não inicializado:", error);
    });
};

// Inicializa analytics após 2s para não impactar FCP/LCP
setTimeout(initAnalyticsServices, 2000);

// ✅ OTIMIZAÇÃO: Sentry lazy loading avançado
// Carrega apenas após interação do usuário OU após 5s de idle
// Economia: ~238KB de código não utilizado imediatamente
let sentryInitialized = false;

const initSentry = () => {
  if (sentryInitialized) return;
  sentryInitialized = true;

  import("./services/error-tracking")
    .then(({ initErrorTracking }) => {
      initErrorTracking();
    })
    .catch((error) => {
      console.error("❌ Failed to initialize Sentry:", error);
    });
};

// Estratégia 1: Carregar Sentry após primeira interação do usuário
const initOnInteraction = () => {
  const events = ["click", "keydown", "scroll", "touchstart"];
  const handler = () => {
    events.forEach((e) => globalThis.window.removeEventListener(e, handler, { capture: true }));
    // Usar requestIdleCallback para não bloquear a interação
    if ("requestIdleCallback" in globalThis) {
      requestIdleCallback(() => initSentry(), { timeout: 2000 });
    } else {
      setTimeout(initSentry, 100);
    }
  };
  events.forEach((e) =>
    globalThis.window.addEventListener(e, handler, { capture: true, passive: true })
  );
};

// Estratégia 2: Fallback - carregar após 5s se usuário não interagir
const initOnIdle = () => {
  if ("requestIdleCallback" in globalThis) {
    requestIdleCallback(
      () => {
        setTimeout(initSentry, 5000); // 5s delay após idle
      },
      { timeout: 10000 }
    );
  } else {
    setTimeout(initSentry, 8000); // 8s para browsers sem requestIdleCallback
  }
};

initOnInteraction();
initOnIdle();

createRoot(rootElement).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <StrictMode>
      <App />
    </StrictMode>
  </ErrorBoundary>
);

// ✅ Limpa o timeout de loading quando o React carrega
if (
  globalThis.window !== undefined &&
  (globalThis.window as unknown as { __clearLoadingTimeout?: () => void }).__clearLoadingTimeout
) {
  (globalThis.window as unknown as { __clearLoadingTimeout: () => void }).__clearLoadingTimeout();
}
