import { test, expect } from '@playwright/test';

test.describe('Navegação e Interações', () => {
  test('deve navegar entre páginas e voltar', async ({ page }) => {
    // browser_navigate
    await page.goto('/');
    await expect(page).toHaveURL(/\//);
    
    // browser_navigate_back
    await page.goBack();
    await page.goForward();
  });

  test('deve clicar em elementos', async ({ page }) => {
    await page.goto('/');
    
    // browser_click
    const button = page.locator('button').first();
    if (await button.count() > 0) {
      await button.click();
    }
  });

  test('deve fazer hover em elementos', async ({ page }) => {
    await page.goto('/');
    
    // browser_hover
    const element = page.locator('button, a').first();
    if (await element.count() > 0) {
      await element.hover();
    }
  });

  test('deve gerenciar abas', async ({ context }) => {
    // browser_tabs
    const page = await context.newPage();
    await page.goto('/');
    
    const page2 = await context.newPage();
    await page2.goto('/api/health');
    
    const pages = context.pages();
    expect(pages.length).toBeGreaterThanOrEqual(2);
    
    await page2.close();
  });

  test('deve aguardar elementos', async ({ page }) => {
    await page.goto('/');
    
    // browser_wait_for
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('body', { state: 'visible' });
  });
});
