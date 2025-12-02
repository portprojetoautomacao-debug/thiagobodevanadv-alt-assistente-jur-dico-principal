import { expect, test } from "@playwright/test";

test.describe("Fluxo Principal da Aplicação", () => {
  test.beforeEach(async ({ page }) => {
    // Simula um usuário autenticado injetando no localStorage
    await page.addInitScript(() => {
      const user = {
        name: "Test User",
        email: "test@example.com",
        picture: "https://example.com/avatar.jpg",
        role: "advogado",
      };
      window.localStorage.setItem("user", JSON.stringify(user));
    });
  });

  test("deve carregar o Dashboard quando autenticado", async ({ page }) => {
    await page.goto("/");

    // Verifica se o título do Dashboard está visível
    // O Dashboard tem um título "Meu Painel" ou similar nos cards
    // Vamos verificar elementos específicos do Dashboard
    await expect(page.getByText("Meu Painel")).toBeVisible();
    await expect(page.getByText("PJe Assistente")).toBeVisible();
  });

  test("deve navegar para o CRM de Processos", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Clica via test id ou fallback por texto
    const navProcesses = page.getByTestId("nav-processes");
    if (await navProcesses.count()) {
      await navProcesses.click();
    } else {
      await page.click("text=Acervo (CRM)");
    }

    // Verifica se mudou para a view de processos
    // O componente ProcessCRM deve ter um título ou elementos específicos
    await expect(page.getByText("Kanban de Processos")).toBeVisible();
    // Verifica se as colunas do Kanban estão presentes
    await expect(page.getByText("Triagem Inicial")).toBeVisible();
  });

  test("deve navegar para a Calculadora de Prazos", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Clica via test id ou fallback por texto
    const navCalc = page.getByTestId("nav-calculator");
    if (await navCalc.count()) {
      await navCalc.click();
    } else {
      await page.click("text=Calc. Prazos");
    }

    // Verifica se a calculadora carregou
    await expect(
      page.getByText("Calculadora de Prazos Processuais")
    ).toBeVisible();
  });
});
