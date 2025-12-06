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
    // Verifica se o dashboard carregou - aceita tanto "Dashboard" quanto "PJe Assistente"
    // Usa .first() para evitar strict mode violation quando ambos estão presentes
    const heading = page.getByRole("heading", { name: /Dashboard|PJe Assistente/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Verifica se navegação está presente
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("deve navegar para o CRM de Processos", async ({ page }) => {
    // Clica no botão de navegação usando Test ID ou ARIA button (Sidebar usa Button, não link)
    const navButton = page
      .getByTestId("nav-processes")
      .or(page.getByRole("button", { name: /Processos|CRM|Acervo/i }));

    await navButton.click({ timeout: 10000 });

    // Aguarda hash change para #processes
    await page.waitForURL(/.*#processes/, { timeout: 10000 });

    // Verifica se a página de processos carregou usando heading
    await expect(page.getByRole("heading", { name: /Processos|CRM/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test("deve navegar para a Calculadora de Prazos", async ({ page }) => {
    // Clica no link de navegação usando Test ID ou ARIA link
    const navLink = page
      .getByTestId("nav-calculator")
      .or(page.getByRole("button", { name: /Calculadora|Prazos/i }))
      .or(page.getByRole("link", { name: /Calculadora|Prazos/i }));

    await navLink.first().click({ timeout: 10000 });

    // Aguarda hash change para #calculator
    await page.waitForURL(/.*#(calculator|prazos)/, { timeout: 10000 });

    // Verifica se a calculadora carregou usando heading ou form
    const heading = page.getByRole("heading", { name: /Calculadora|Prazos/i }).first();
    const form = page.locator("form").first();
    await expect(heading.or(form)).toBeVisible({ timeout: 10000 });
  });
});
