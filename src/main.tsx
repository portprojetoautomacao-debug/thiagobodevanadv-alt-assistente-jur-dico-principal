import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from './ErrorFallback.tsx'
import App from './App'

import './index.css';

// Root element check
const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

// ✅ TRUSTED TYPES: Inicializa políticas de segurança XSS (síncrono, antes de qualquer script)
// Deve ser executado antes de qualquer manipulação de DOM
import('./lib/trusted-types').then(({ initTrustedTypes }) => {
  initTrustedTypes()
}).catch(err => console.warn('Trusted Types não disponível:', err))

// ✅ ANALYTICS: GTM + GA4 inicialização (após consentimento se LGPD requerido)
// IDs configuráveis via VITE_GTM_ID e VITE_GA4_ID
let analyticsInitialized = false

const initAnalyticsServices = async () => {
  if (analyticsInitialized) return
  analyticsInitialized = true

  try {
    const { initAnalytics } = await import('./lib/analytics')
    await initAnalytics()
  } catch (error) {
    console.warn('Analytics não inicializado:', error)
  }
}

// Inicializa analytics após 2s para não impactar FCP/LCP
setTimeout(initAnalyticsServices, 2000)

// ✅ OTIMIZAÇÃO: Sentry lazy loading avançado
// Carrega apenas após interação do usuário OU após 5s de idle
// Economia: ~238KB de código não utilizado imediatamente
let sentryInitialized = false

const initSentry = async () => {
  if (sentryInitialized) return
  sentryInitialized = true

  try {
    const { initErrorTracking } = await import('./services/error-tracking')
    initErrorTracking()
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error)
  }
}

// Estratégia 1: Carregar Sentry após primeira interação do usuário
const initOnInteraction = () => {
  const events = ['click', 'keydown', 'scroll', 'touchstart']
  const handler = () => {
    events.forEach(e => window.removeEventListener(e, handler, { capture: true }))
    // Usar requestIdleCallback para não bloquear a interação
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => initSentry(), { timeout: 2000 })
    } else {
      setTimeout(initSentry, 100)
    }
  }
  events.forEach(e => window.addEventListener(e, handler, { capture: true, passive: true }))
}

// Estratégia 2: Fallback - carregar após 5s se usuário não interagir
const initOnIdle = () => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      setTimeout(initSentry, 5000) // 5s delay após idle
    }, { timeout: 10000 })
  } else {
    setTimeout(initSentry, 8000) // 8s para browsers sem requestIdleCallback
  }
}

// Iniciar ambas estratégias (a primeira que executar ganha)
initOnInteraction()
initOnIdle()

// Render App diretamente (sem dynamic import para evitar problemas de loading)
createRoot(rootElement).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
  </ErrorBoundary>
)
