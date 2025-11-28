import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from './ErrorFallback.tsx'

import './index.css';

// Root element check
const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

// ✅ OTIMIZAÇÃO: Sentry lazy loading avançado
// Carrega apenas após interação do usuário OU após 5s de idle
// Economia: ~238KB de código não utilizado imediatamente
let sentryInitialized = false

const initSentry = async () => {
  if (sentryInitialized) return
  sentryInitialized = true

  try {
    const { initErrorTracking } = await import('./services/error-tracking')
    await initErrorTracking()
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

// Dynamic import of App para reduzir bundle inicial
import('./App').then(({ default: App }) => {
  createRoot(rootElement).render(
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <App />
    </ErrorBoundary>
  )
}).catch(err => {
  console.error('Failed to load App:', err)
  rootElement.innerHTML = `<div style="color: red; padding: 20px;">Failed to load application: ${err.message}</div>`
})
