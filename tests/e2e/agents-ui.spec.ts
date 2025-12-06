import { expect, test } from "@playwright/test";

test.describe("Agentes IA - Testes de UI e Funcionalidade", () => {
  test.beforeEach(async ({ page }) => {
    // Simula um usuário autenticado ANTES do carregamento
    await page.addInitScript(() => {
      const user = {
        name: "Test User",
        email: "test@example.com",
        picture: "https://example.com/avatar.jpg",
        role: "advogado",
      };
      window.localStorage.setItem("user", JSON.stringify(user));
    });
    // Navega direto para a página de agentes por hash (fallback de roteamento)
    await page.goto("/#ai-agents");
  });

  test("deve carregar a página de Agentes IA", async ({ page }) => {
    // Aguarda a página carregar completamente
    await page.waitForLoadState("networkidle");

    // Verifica se a página de agentes carregou usando o título real do componente
    await expect(
      page
        .getByRole("heading", { name: /Agentes de IA Autônomos|Harvey Specter|Mrs\. Justin-e/i })
        .first()
    ).toBeVisible({ timeout: 15000 });

    // Verificar se navegação está presente
    await expect(page.getByRole("navigation").first()).toBeVisible();
  });

  test("deve mostrar status dos agentes corretamente", async ({ page }) => {
    // Verifica se a página está carregada
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Verifica se há pelo menos um badge de status (Ativo, Pausado, Streaming)
    const statusBadges = page.getByText(/^(Ativo|Pausado|Streaming)$/);
    await expect(statusBadges.first()).toBeVisible({ timeout: 10000 });

    // Verifica se status está visível (aceita vários formatos)
    const statusText = page.getByText(/\d+ ativo\(s\)|Nenhum ativado|processando/i);
    await expect(statusText.first()).toBeVisible();
  });

  test("deve permitir alternar status dos agentes", async ({ page }) => {
    // Aguarda cards de agentes carregarem usando heading de agente
    await expect(
      page.getByRole("heading", { name: /Harvey|Justin|Monitor|Análise/i }).first()
    ).toBeVisible({ timeout: 10000 });

    // Localiza o switch usando ARIA role (melhor prática)
    const agentSwitch = page.getByRole("switch").first();
    await agentSwitch.waitFor({ state: "visible", timeout: 10000 });

    // Verifica estado inicial
    const initialState = await agentSwitch.getAttribute("data-state");

    // Alterna o estado
    await agentSwitch.click();
    await page.waitForTimeout(500); // Aguarda animação

    // Verifica se estado mudou
    const newState = await agentSwitch.getAttribute("data-state");
    expect(newState).not.toBe(initialState);

    // Alterna novamente para restaurar
    await agentSwitch.click();
  });

  test("deve mostrar métricas dos agentes", async ({ page }) => {
    // Abre a aba de Métricas usando ARIA tab role
    const metricsTab = page.getByRole("tab", { name: /Métricas/i });

    if ((await metricsTab.count()) > 0) {
      await metricsTab.click();
      await page.waitForTimeout(500); // Aguarda conteúdo carregar
    }

    // Verifica conteúdo de métricas usando texto específico
    await expect(
      page.getByText(/Taxa de Sucesso|Tarefas Completadas|Desempenho/i).first()
    ).toBeVisible({ timeout: 10000 });

    // Verifica se há pelo menos um indicador visual (progressbar ARIA)
    await expect(page.locator('[role="progressbar"]').first()).toBeVisible();
  });

  test("deve permitir executar tarefas manuais dos agentes", async ({ page }) => {
    // Já estamos na tela de agentes via hash

    // Procura por botões de ação dos agentes
    const actionButtons = page.locator(
      'button:has-text("Executar"), button:has-text("Run"), button:has-text("Process")'
    );

    // Se houver botões de ação, testa um deles
    if ((await actionButtons.count()) > 0) {
      await actionButtons.first().click();

      // Verifica se mostra feedback de execução
      await expect(page.getByText(/executando|processing|running/i)).toBeVisible();
    }
  });
  test("deve mostrar logs de atividade dos agentes", async ({ page }) => {
    // Já estamos na tela de agentes via hash

    // Abre a aba "Atividade em Tempo Real" que contém os logs
    const activityTab = page.getByRole("tab", { name: /Atividade em Tempo Real/i });

    if ((await activityTab.count()) > 0) {
      await activityTab.click();

      // Aguarda o conteúdo carregar
      await page.waitForTimeout(500);

      // Verifica se mostra o registro de atividades (baseado no snapshot do DOM)
      await expect(page.getByText(/Registro de Atividades/i)).toBeVisible();

      // Verifica se mostra pelo menos uma entrada de log
      await expect(page.locator('p:has-text("Tarefa concluída:")').first()).toBeVisible();
    }
  });

  test("deve permitir configuração de geração automática de tarefas", async ({ page }) => {
    // Já estamos na tela de agentes via hash

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

  test("deve mostrar modal de colaboração Harvey + Mrs. Justin-e", async ({ page }) => {
    // Já estamos na tela de agentes via hash

    // Procura por botão de colaboração ou demo
    const collaborationButton = page.locator(
      'button:has-text("Colaboração"), button:has-text("Demo"), button:has-text("Collaboration")'
    );

    if ((await collaborationButton.count()) > 0) {
      await collaborationButton.first().click();

      // Verifica se o modal abriu
      await expect(page.getByText(/Harvey.*Justin-e|colaboração|collaboration/i)).toBeVisible();
    }
  });

  test("deve permitir backup e restauração de agentes", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Já estamos na tela de agentes via hash

    // Procura por botões de backup
    const backupButton = page.locator('button:has-text("Backup"), button:has-text("Salvar")');

    if ((await backupButton.count()) > 0) {
      await backupButton.first().click();

      // Verifica feedback de sucesso
      await expect(page.getByText(/backup.*sucesso|salvo.*sucesso/i)).toBeVisible();
    }
  });

  test("deve mostrar orquestração de agentes", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Já estamos na tela de agentes via hash

    // Procura por painel de orquestração
    const orchestrationButton = page.locator(
      'button:has-text("Orquestração"), button:has-text("Orchestration")'
    );

    if ((await orchestrationButton.count()) > 0) {
      await orchestrationButton.first().click();

      // Verifica se mostra workflow de agentes
      await expect(page.getByText(/workflow|orquestração|orchestration/i)).toBeVisible();
    }
  });

  test("deve responder corretamente a comandos dos agentes via UI", async ({ page }) => {
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
      await expect(page.getByText(/performance|insights|estratégico/i)).toBeVisible();
    }
  });

  test("deve mostrar pensamento e respostas dos agentes em tempo real", async ({ page }) => {
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
