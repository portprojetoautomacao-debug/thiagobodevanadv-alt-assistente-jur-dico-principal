import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import { initErrorTracking } from './services/error-tracking'

// import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import './index.css';

// Initialize Sentry Error Tracking FIRST
(async () => {
  try {
    await initErrorTracking()
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error)
  }
})()

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

// Dynamic import of App to ensure Spark fixes are applied first
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
