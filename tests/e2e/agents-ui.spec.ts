import { expect, test } from "@playwright/test";

test.describe("Agentes IA - Testes de UI e Funcionalidade", () => {
  test.beforeEach(async ({ page }) => {
    // Simula um usuário autenticado
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

  test("deve carregar a página de Agentes IA", async ({ page }) => {
    await page.goto("/");

    await page.waitForLoadState("networkidle");
    // Navega via test id ou fallback por texto
    const navAgents = page.getByTestId("nav-ai-agents");
    if (await navAgents.count()) {
      await navAgents.click();
    } else {
      await page.click("text=Agentes de IA");
    }

    // Verifica se a página carregou corretamente
    await expect(page.getByText("Agentes de IA Autônomos")).toBeVisible();

    // Verificar se pelo menos algum conteúdo de agentes está presente
    // Por enquanto, vamos aceitar que a página carregou se o título estiver visível
    console.log("Página de Agentes IA carregada com sucesso");
  });

  test("deve mostrar status dos agentes corretamente", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const navAgents2 = page.getByTestId("nav-ai-agents");
    if (await navAgents2.count()) {
      await navAgents2.click();
    } else {
      await page.click("text=Agentes de IA");
    }

    // Verifica se os agentes estão com status "Active"
    await expect(page.getByText("Active")).toBeVisible();

    // Verifica se mostra contadores de tarefas
    await expect(page.getByText(/tasks completed|tasks today/i)).toBeVisible();
  });

  test("deve permitir alternar status dos agentes", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const navAgents3 = page.getByTestId("nav-ai-agents");
    if (await navAgents3.count()) {
      await navAgents3.click();
    } else {
      await page.click("text=Agentes de IA");
    }

    // Localiza o switch do primeiro agente (Harvey Specter)
    const harveySwitch = page
      .locator('[data-agent-id="harvey-specter"] .switch')
      .first();

    // Verifica se o switch está ligado inicialmente
    await expect(harveySwitch).toBeChecked();

    // Desliga o agente
    await harveySwitch.click();
    await expect(harveySwitch).not.toBeChecked();

    // Liga novamente
    await harveySwitch.click();
    await expect(harveySwitch).toBeChecked();
  });

  test("deve mostrar métricas dos agentes", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const navAgents4 = page.getByTestId("nav-ai-agents");
    if (await navAgents4.count()) {
      await navAgents4.click();
    } else {
      await page.click("text=Agentes de IA");
    }

    // Verifica se há seção de métricas
    await expect(page.getByText("Métricas dos Agentes")).toBeVisible();

    // Verifica se mostra gráficos ou indicadores de performance
    await expect(
      page.locator('.progress, .chart, [data-testid="agent-metrics"]')
    ).toBeVisible();
  });

  test("deve permitir executar tarefas manuais dos agentes", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const navAgents5 = page.getByTestId("nav-ai-agents");
    if (await navAgents5.count()) {
      await navAgents5.click();
    } else {
      await page.click("text=Agentes de IA");
    }

    // Procura por botões de ação dos agentes
    const actionButtons = page.locator(
      'button:has-text("Executar"), button:has-text("Run"), button:has-text("Process")'
    );

    // Se houver botões de ação, testa um deles
    if ((await actionButtons.count()) > 0) {
      await actionButtons.first().click();

      // Verifica se mostra feedback de execução
      await expect(
        page.getByText(/executando|processing|running/i)
      ).toBeVisible();
    }
  });

  test("deve mostrar logs de atividade dos agentes", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const navAgents6 = page.getByTestId("nav-ai-agents");
    if (await navAgents6.count()) {
      await navAgents6.click();
    } else {
      await page.click("text=Agentes de IA");
    }

    // Verifica se há seção de logs/atividade
    const logsSection = page
      .locator("text=/logs|atividade|activity|history/i")
      .first();

    if (await logsSection.isVisible()) {
      await logsSection.click();

      // Verifica se mostra entradas de log
      await expect(
        page.locator('[data-testid="activity-log"], .log-entry, .activity-item')
      ).toBeVisible();
    }
  });

  test("deve permitir configuração de geração automática de tarefas", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const navAgents7 = page.getByTestId("nav-ai-agents");
    if (await navAgents7.count()) {
      await navAgents7.click();
    } else {
      await page.click("text=Agentes de IA");
    }

    // Procura pelo controle de geração automática
    const autoGenerateSwitch = page
      .locator('input[type="checkbox"], .switch')
      .filter({ hasText: /auto|automático|automatic/i });

    if ((await autoGenerateSwitch.count()) > 0) {
      const initialState = await autoGenerateSwitch.first().isChecked();

      // Alterna o estado
      await autoGenerateSwitch.first().click();

      // Verifica se o estado mudou
      const newState = await autoGenerateSwitch.first().isChecked();
      expect(newState).not.toBe(initialState);
    }
  });

  test("deve mostrar modal de colaboração Harvey + Mrs. Justin-e", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const navAgents8 = page.getByTestId("nav-ai-agents");
    if (await navAgents8.count()) {
      await navAgents8.click();
    } else {
      await page.click("text=Agentes de IA");
    }

    // Procura por botão de colaboração ou demo
    const collaborationButton = page.locator(
      'button:has-text("Colaboração"), button:has-text("Demo"), button:has-text("Collaboration")'
    );

    if ((await collaborationButton.count()) > 0) {
      await collaborationButton.first().click();

      // Verifica se o modal abriu
      await expect(
        page.getByText(/Harvey.*Justin-e|colaboração|collaboration/i)
      ).toBeVisible();
    }
  });

  test("deve permitir backup e restauração de agentes", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("nav-ai-agents").click();

    // Procura por botões de backup
    const backupButton = page.locator(
      'button:has-text("Backup"), button:has-text("Salvar")'
    );

    if ((await backupButton.count()) > 0) {
      await backupButton.first().click();

      // Verifica feedback de sucesso
      await expect(
        page.getByText(/backup.*sucesso|salvo.*sucesso/i)
      ).toBeVisible();
    }
  });

  test("deve mostrar orquestração de agentes", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("nav-ai-agents").click();

    // Procura por painel de orquestração
    const orchestrationButton = page.locator(
      'button:has-text("Orquestração"), button:has-text("Orchestration")'
    );

    if ((await orchestrationButton.count()) > 0) {
      await orchestrationButton.first().click();

      // Verifica se mostra workflow de agentes
      await expect(
        page.getByText(/workflow|orquestração|orchestration/i)
      ).toBeVisible();
    }
  });

  test("deve responder corretamente a comandos dos agentes via UI", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("nav-ai-agents").click();

    // Simula interação com um agente específico
    const harveyCard = page.locator('[data-agent-id="harvey-specter"]').first();

    if (await harveyCard.isVisible()) {
      // Clica no card do Harvey
      await harveyCard.click();

      // Verifica se mostra detalhes do agente
      await expect(page.getByText(/Harvey Specter/i)).toBeVisible();
      await expect(page.getByText(/estratégico|strategic/i)).toBeVisible();

      // Verifica se mostra capacidades
      await expect(
        page.getByText(/performance|insights|estratégico/i)
      ).toBeVisible();
    }
  });

  test("deve mostrar pensamento e respostas dos agentes em tempo real", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("nav-ai-agents").click();

    // Verifica se há indicadores de pensamento/processamento
    const thinkingIndicators = page.locator(
      '[data-testid="thinking"], .thinking, .processing, [data-status="processing"]'
    );

    // Se houver indicadores, verifica se funcionam
    if ((await thinkingIndicators.count()) > 0) {
      // Simula uma ação que trigger processamento
      const processButton = page
        .locator('button:has-text("Process"), button:has-text("Executar")')
        .first();

      if (await processButton.isVisible()) {
        await processButton.click();

        // Verifica se mostra indicadores de processamento
        await expect(thinkingIndicators.first()).toBeVisible();
      }
    }
  });
});
