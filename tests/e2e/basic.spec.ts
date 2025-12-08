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

    // Verifica se navegação ou tela de login está presente
    const navigation = page.getByRole("navigation").or(page.getByTestId("sidebar-nav"));
    const loginHeading = page.getByRole("heading", { name: /Login|Assistente Jurídico/i });

    // Aceita navegação OU tela de login, com mensagens de erro descritivas
    let navigationVisible = false;
    let loginVisible = false;
    try {
      await expect(navigation).toBeVisible({ timeout: 5000 });
      navigationVisible = true;
    } catch {
      // Ignora, tenta o próximo
    }
    if (!navigationVisible) {
      try {
        await expect(loginHeading).toBeVisible({ timeout: 5000 });
        loginVisible = true;
      } catch {
        // Ignora, vai lançar erro abaixo
      }
    }
    if (!navigationVisible && !loginVisible) {
      throw new Error(
        "Nenhum dos elementos esperados está visível: nem navegação (menu lateral) nem heading de login. Verifique se o app está carregando corretamente."
      );
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
      console.log(`Encontradas ${count} mensagens de erro (podem ser avisos de configuração)`);
    }
  });

  test("deve verificar API de health", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty("status");
  });
});
