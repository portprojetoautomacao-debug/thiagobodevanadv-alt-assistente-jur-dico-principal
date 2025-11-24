/**
 * Vitest global setup file
 * Configures the test environment before running tests
 */

import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Limpa após cada teste
afterEach(() => {
  cleanup()
})

// Mock de variáveis de ambiente se necessário
process.env.VITE_TODOIST_API_TOKEN = 'test-token'
process.env.VITE_GOOGLE_CLIENT_ID = 'test-client-id'
}

