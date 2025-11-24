/**
 * Vitest global setup file
 * Configures the test environment before running tests
 */

import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

// Mock environment variables for tests
if (typeof process !== 'undefined' && process.env) {
  process.env.VITE_GOOGLE_CLIENT_ID = 'test-client-id'
  process.env.VITE_GOOGLE_API_KEY = 'test-api-key'
  process.env.VITE_REDIRECT_URI = 'http://localhost:5173'
  process.env.VITE_APP_ENV = 'test'
}

