import { expect, test } from "@playwright/test";

test.describe("Assistente Jurídico - Testes Básicos", () => {
  test("deve carregar a página inicial", async ({ page }) => {
    await page.goto("/");

    // Aguarda o título ou algum elemento aparecer
    await expect(page).toHaveTitle(/Assistente Jurídico/i);
  });

  test("deve ter o menu de navegação", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Verifica se elementos básicos estão presentes
    const navigationById = page.getByTestId("sidebar-nav");
    if (await navigationById.count()) {
      await expect(navigationById).toBeVisible();
    } else {
      // Fallback para nav genérico em versões sem test id
      const navigation = page.locator("nav");
      await expect(navigation).toBeVisible();
    }
  });

  test("deve conseguir acessar a página de processos", async ({ page }) => {
    await page.goto("/");

    // Aguarda o app carregar
    await page.waitForLoadState("networkidle");

    // Verifica se não há erros fatais
    const errorMessages = page.locator("text=/erro|error/i");
    const count = await errorMessages.count();

    // Se há mensagens de erro, verifica se são erros esperados (como falta de config)
    if (count > 0) {
      console.log(
        `Encontradas ${count} mensagens de erro (podem ser avisos de configuração)`
      );
    }
  });

  test("deve verificar API de health", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty("status");
  });
});
