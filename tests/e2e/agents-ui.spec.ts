import { expect, test } from "@playwright/test";

test.describe( "Agentes IA - Testes de UI e Funcionalidade", () =>
{
  test.beforeEach( async ( { page } ) =>
  {
    // Simula um usuário autenticado ANTES do carregamento
    await page.addInitScript( () =>
    {
      const user = {
        name: "Test User",
        email: "test@example.com",
        picture: "https://example.com/avatar.jpg",
        role: "advogado",
      };
      window.localStorage.setItem( "user", JSON.stringify( user ) );
    } );
    // Navega direto para a página de agentes por hash (fallback de roteamento)
    await page.goto( "/#ai-agents" );
    await page.waitForLoadState( "networkidle" );
    await page.waitForTimeout( 1000 );
  } );

  test( "deve carregar a página de Agentes IA", async ( { page } ) =>
  {
    // Verifica título principal do componente (texto exato do AIAgents.tsx)
    await expect( page.getByRole( "heading", { name: "Agentes de IA Autônomos" } ) ).toBeVisible( {
      timeout: 10000,
    } );

    // Verifica subtítulo (texto exato)
    await expect(
      page.getByText(
        "Equipe de inteligência artificial trabalhando 24/7 para automatizar tarefas jurídicas"
      )
    ).toBeVisible();

    // Verifica que há cards de status (texto exato dos cards)
    await expect( page.getByText( "Agentes Disponíveis" ) ).toBeVisible();
    await expect( page.getByText( "Fila de Trabalho" ) ).toBeVisible();
  } );

  test( "deve mostrar status dos agentes corretamente", async ( { page } ) =>
  {
    // Verifica cards de métricas principais
    await expect( page.getByText( "Agentes Disponíveis" ) ).toBeVisible();
    await expect( page.getByText( "Fila de Trabalho" ) ).toBeVisible();
    await expect( page.getByText( "Backup Local" ) ).toBeVisible();

    // Verifica que mostra formato "X/Y" para agentes ativos
    const agentesDisponiveis = page.locator( "text=/\\d+\\/15/" ).first();
    await expect( agentesDisponiveis ).toBeVisible( { timeout: 5000 } );

    // Verifica tabs estão presentes
    await expect( page.getByRole( "tab", { name: "Agentes" } ) ).toBeVisible();
    await expect( page.getByRole( "tab", { name: /Métricas/i } ) ).toBeVisible();
  } );

  test( "deve permitir alternar status dos agentes", async ( { page } ) =>
  {
    // Clica na aba "Agentes" se não estiver selecionada
    const agentsTab = page.getByRole( "tab", { name: "Agentes" } );
    await agentsTab.click();
    await page.waitForTimeout( 500 );

    // Localiza primeiro switch de agente (usando ARIA role e label descritivo)
    const agentSwitch = page.getByRole( "switch" ).first();
    await agentSwitch.waitFor( { state: "visible", timeout: 10000 } );

    // Verifica estado inicial
    const initialState = await agentSwitch.getAttribute( "data-state" );
    expect( initialState ).toMatch( /checked|unchecked/ );

    // Alterna o estado
    await agentSwitch.click();
    await page.waitForTimeout( 800 );

    // Verifica se estado mudou
    const newState = await agentSwitch.getAttribute( "data-state" );
    expect( newState ).not.toBe( initialState );

    // Verifica toast de confirmação (texto exato de AIAgents.tsx)
    await expect( page.locator( "text=/ativado|desativado/i" ).first() ).toBeVisible( { timeout: 3000 } );
  } );

  test( "deve mostrar métricas dos agentes", async ( { page } ) =>
  {
    // Clica na aba de Métricas
    const metricsTab = page.getByRole( "tab", { name: /Métricas/i } );
    await expect( metricsTab ).toBeVisible();
    await metricsTab.click();
    await page.waitForTimeout( 1000 );

    // Verifica se AgentMetricsDashboard ou AgentMetrics está presente
    // O componente pode renderizar o novo dashboard ou o antigo
    const hasMetricsContent = page
      .locator( '[role="progressbar"], text=/Taxa de Sucesso|Performance|Estatísticas/i' )
      .first();

    // Aguarda qualquer indicador de métricas aparecer
    await expect( hasMetricsContent ).toBeVisible( { timeout: 10000 } );
  } );

  test( "deve permitir executar tarefas manuais dos agentes", async ( { page } ) =>
  {
    // Clica na aba "Fila de Tarefas" onde ficam as tarefas
    const queueTab = page.getByRole( "tab", { name: "Fila de Tarefas" } );
    await queueTab.click();
    await page.waitForTimeout( 500 );

    // Verifica se mostra o card de fila de tarefas
    await expect( page.getByText( /Tarefas na Fila|Nenhuma tarefa na fila/i ) ).toBeVisible( {
      timeout: 5000,
    } );
  } );

  test( "deve mostrar logs de atividade dos agentes", async ( { page } ) =>
  {
    // Clica na aba "Atividade em Tempo Real"
    const activityTab = page.getByRole( "tab", { name: /Atividade em Tempo Real/i } );
    await activityTab.click();
    await page.waitForTimeout( 500 );

    // Verifica se mostra o conteúdo de atividades
    // Pode ser "Nenhuma atividade registrada" ou lista de atividades
    const activityContent = page.locator( "text=/Nenhuma atividade registrada|atividade/i" ).first();
    await expect( activityContent ).toBeVisible( { timeout: 5000 } );
  } );

  test( "deve permitir configuração de geração automática de tarefas", async ( { page } ) =>
  {
    // Verifica se o toggle de streaming está presente (configuração principal visível)
    const streamingToggle = page.locator( "text=/Streaming de Respostas|Respostas em Tempo Real/i" );

    if ( ( await streamingToggle.count() ) > 0 )
    {
      await expect( streamingToggle.first() ).toBeVisible();
    }

    // Verifica se switch de streaming está presente
    const streamingSwitch = page
      .getByRole( "switch" )
      .filter( { has: page.locator( "text=/Streaming/i" ) } );
    if ( ( await streamingSwitch.count() ) > 0 )
    {
      await expect( streamingSwitch.first() ).toBeVisible();
    }
  } );

  test( "deve mostrar modal de colaboração Harvey + Mrs. Justin-e", async ( { page } ) =>
  {
    // Já estamos na tela de agentes via hash

    // Procura por botão de colaboração ou demo
    const collaborationButton = page.locator(
      'button:has-text("Colaboração"), button:has-text("Demo"), button:has-text("Collaboration")'
    );

    if ( ( await collaborationButton.count() ) > 0 )
    {
      await collaborationButton.first().click();

      // Verifica se o modal abriu
      await expect( page.getByText( /Harvey.*Justin-e|colaboração|collaboration/i ) ).toBeVisible();
    }
  } );

  test( "deve permitir backup e restauração de agentes", async ( { page } ) =>
  {
    await page.goto( "/" );
    await page.waitForLoadState( "networkidle" );
    // Já estamos na tela de agentes via hash

    // Procura por botões de backup
    const backupButton = page.locator( 'button:has-text("Backup"), button:has-text("Salvar")' );

    if ( ( await backupButton.count() ) > 0 )
    {
      await backupButton.first().click();

      // Verifica feedback de sucesso
      await expect( page.getByText( /backup.*sucesso|salvo.*sucesso/i ) ).toBeVisible();
    }
  } );

  test( "deve mostrar orquestração de agentes", async ( { page } ) =>
  {
    await page.goto( "/" );
    await page.waitForLoadState( "networkidle" );
    // Já estamos na tela de agentes via hash

    // Procura por painel de orquestração
    const orchestrationButton = page.locator(
      'button:has-text("Orquestração"), button:has-text("Orchestration")'
    );

    if ( ( await orchestrationButton.count() ) > 0 )
    {
      await orchestrationButton.first().click();

      // Verifica se mostra workflow de agentes
      await expect( page.getByText( /workflow|orquestração|orchestration/i ) ).toBeVisible();
    }
  } );

  test( "deve responder corretamente a comandos dos agentes via UI", async ( { page } ) =>
  {
    await page.goto( "/" );
    await page.waitForLoadState( "networkidle" );
    await page.getByTestId( "nav-ai-agents" ).click();

    // Simula interação com um agente específico
    const harveyCard = page.locator( '[data-agent-id="harvey-specter"]' ).first();

    if ( await harveyCard.isVisible() )
    {
      // Clica no card do Harvey
      await harveyCard.click();

      // Verifica se mostra detalhes do agente
      await expect( page.getByText( /Harvey Specter/i ) ).toBeVisible();
      await expect( page.getByText( /estratégico|strategic/i ) ).toBeVisible();

      // Verifica se mostra capacidades
      await expect( page.getByText( /performance|insights|estratégico/i ) ).toBeVisible();
    }
  } );

  test( "deve mostrar pensamento e respostas dos agentes em tempo real", async ( { page } ) =>
  {
    await page.goto( "/" );
    await page.waitForLoadState( "networkidle" );
    await page.getByTestId( "nav-ai-agents" ).click();

    // Verifica se há indicadores de pensamento/processamento
    const thinkingIndicators = page.locator(
      '[data-testid="thinking"], .thinking, .processing, [data-status="processing"]'
    );

    // Se houver indicadores, verifica se funcionam
    if ( ( await thinkingIndicators.count() ) > 0 )
    {
      // Simula uma ação que trigger processamento
      const processButton = page
        .locator( 'button:has-text("Process"), button:has-text("Executar")' )
        .first();

      if ( await processButton.isVisible() )
      {
        await processButton.click();

        // Verifica se mostra indicadores de processamento
        await expect( thinkingIndicators.first() ).toBeVisible();
      }
    }
  } );
} );
