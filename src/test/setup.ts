import { afterEach } from 'vitest'

// Mock cleanup function if @testing-library/react is not available
const cleanup = () => {
  // No-op for now - will be replaced when @testing-library/react is added
}

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

