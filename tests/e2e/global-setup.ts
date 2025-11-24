/**
 * Global setup for Playwright E2E tests
 * This runs before all tests
 */

import { chromium } from '@playwright/test';

async function globalSetup() {
  // Any global setup can go here
  console.log('🚀 Starting E2E tests...');
}

export default globalSetup;