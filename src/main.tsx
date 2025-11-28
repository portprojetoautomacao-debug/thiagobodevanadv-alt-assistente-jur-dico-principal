import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from './ErrorFallback.tsx'

import './index.css';

// Root element check
const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

// Initialize Sentry asynchronously (não bloqueia renderização)
const initSentry = async () => {
  try {
    const { initErrorTracking } = await import('./services/error-tracking')
    await initErrorTracking()
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error)
  }
}

// Inicia Sentry em background sem bloquear
initSentry()

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
