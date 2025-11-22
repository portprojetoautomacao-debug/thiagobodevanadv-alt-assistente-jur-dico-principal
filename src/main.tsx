import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import { applySparkClientFixes, applySparkLLMFixes } from './lib/spark-client-fixes'

// import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import './index.css';

// Initialize Spark client with error handling for localization issues
async function initializeSpark() {
  try {
    // Apply safety fixes before Spark loads
    applySparkClientFixes()
    applySparkLLMFixes()
    
    // Import Spark with error handling
    await import("@github/spark/spark").catch(err => {
      // Ignore localization errors - they don't affect functionality
      if (err?.name === 'RegisterClientLocalizationsError') {
        console.warn('Spark localization error ignored:', err.message)
        return
      }
      throw err
    })
  } catch (error) {
    console.error('Failed to initialize Spark:', error)
    // App can still work without Spark in fallback mode
  }
}

// Start Spark initialization (non-blocking)
initializeSpark()

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
