import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import { applySparkClientFixes, applySparkLLMFixes } from './lib/spark-client-fixes'

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import "./main.css"

// Apply safety fixes early, so the wrapper is available to hooks/components
applySparkClientFixes()
applySparkLLMFixes()

// Delay Spark initialization to avoid DOM conflicts
setTimeout(() => {
  import("@github/spark/spark")
}, 100)

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
  </ErrorBoundary>
)
