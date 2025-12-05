import { expect, test } from "@playwright/test";

test.describe("Fluxo Principal da Aplicação", () => {
  test.beforeEach(async ({ page }) => {
    // Simula um usuário autenticado injetando no localStorage ANTES do carregamento
    await page.addInitScript(() => {
      const user = {
        name: "Test User",
        email: "test@example.com",
        picture: "https://example.com/avatar.jpg",
        role: "advogado",
      };
      window.localStorage.setItem("user", JSON.stringify(user));
    });

    // Navega para a raiz e aguarda o shell autenticado aparecer
    await page.goto("/");
    const sidebar = page.getByTestId("sidebar-nav");
    try {
      await expect(sidebar).toBeVisible({ timeout: 10000 });
    } catch {
      // Fallback: aguarda qualquer <nav> aparecer para versões sem test id
      await expect(page.locator("nav")).toBeVisible({ timeout: 10000 });
    }
  });

  test("deve carregar o Dashboard quando autenticado", async ({ page }) => {
    // Após beforeEach, já estamos autenticados e com shell pronto
    // Verifica se o dashboard ou header principal está visível
    await expect(
      page.locator('h1, h2, [role="heading"]').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("deve navegar para o CRM de Processos", async ({ page }) => {
    // Clica via test id ou fallback por texto
    const navProcesses = page.getByTestId("nav-processes");
    const navCount = await navProcesses.count();
    
    if (navCount > 0) {
      await navProcesses.click();
    } else {
      // Tenta encontrar link contendo "Acervo" ou "Processos"
      await page.getByRole("link", { name: /Acervo|Processos/i }).click();
    }

    // Aguarda navegação e verifica se carregou a página de processos
    await page.waitForURL(/.*processos.*|.*acervo.*/i, { timeout: 10000 });
    
    // Verifica se a view de processos está presente (busca por headings ou main content)
    await expect(
      page.locator("h1, h2, main").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("deve navegar para a Calculadora de Prazos", async ({ page }) => {
    // Clica via test id ou fallback por texto
    const navCalc = page.getByTestId("nav-calculator");
    const calcCount = await navCalc.count();
    
    if (calcCount > 0) {
      await navCalc.click();
    } else {
      // Tenta encontrar link contendo "Calc" ou "Prazos"
      await page.getByRole("link", { name: /Calc|Prazos/i }).click();
    }

    // Aguarda navegação e verifica se carregou a calculadora
    await page.waitForURL(/.*calculadora.*|.*prazos.*/i, { timeout: 10000 });
    
    // Verifica se a calculadora está presente (busca por heading ou form)
    await expect(
      page.locator("h1, h2, form, main").first()
    ).toBeVisible({ timeout: 10000 });
  });
});
