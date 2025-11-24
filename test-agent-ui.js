/**
 * Teste Manual da UI dos Agentes IA
 *
 * Este script testa a funcionalidade dos agentes na interface do usuário
 * Execute no console do navegador após carregar a página de Agentes IA
 */

(function() {
  console.log('🚀 Iniciando testes manuais da UI dos Agentes IA...');

  // Teste 1: Verificar se a página carregou corretamente
  function testPageLoad() {
    console.log('📋 Teste 1: Verificação de carregamento da página');

    const titleElement = document.querySelector('h1');
    if (titleElement && titleElement.textContent.includes('Agentes de IA')) {
      console.log('✅ Página carregada corretamente');
      return true;
    } else {
      console.log('❌ Página não carregou corretamente');
      return false;
    }
  }

  // Teste 2: Verificar se os agentes estão visíveis
  function testAgentsVisibility() {
    console.log('👥 Teste 2: Verificação de visibilidade dos agentes');

    const agents = [
      'Harvey Specter',
      'Mrs. Justin-e',
      'Analisador de Documentos',
      'Monitor DJEN',
      'Gestão de Prazos'
    ];

    let visibleCount = 0;
    agents.forEach(agent => {
      const agentElement = Array.from(document.querySelectorAll('*')).find(el =>
        el.textContent && el.textContent.includes(agent)
      );
      if (agentElement) {
        console.log(`✅ Agente encontrado: ${agent}`);
        visibleCount++;
      } else {
        console.log(`❌ Agente não encontrado: ${agent}`);
      }
    });

    console.log(`📊 Total de agentes visíveis: ${visibleCount}/${agents.length}`);
    return visibleCount === agents.length;
  }

  // Teste 3: Verificar status dos agentes
  function testAgentStatus() {
    console.log('📊 Teste 3: Verificação de status dos agentes');

    const statusElements = document.querySelectorAll('[data-status], .status, .badge');
    let activeCount = 0;

    statusElements.forEach(element => {
      const text = element.textContent || '';
      if (text.includes('Active') || text.includes('Ativo') || text.includes('Online')) {
        activeCount++;
      }
    });

    console.log(`📊 Agentes ativos encontrados: ${activeCount}`);
    return activeCount > 0;
  }

  // Teste 4: Verificar controles de toggle
  function testToggleControls() {
    console.log('🔄 Teste 4: Verificação de controles de toggle');

    const toggles = document.querySelectorAll('input[type="checkbox"], .switch, [role="switch"]');
    console.log(`📊 Controles de toggle encontrados: ${toggles.length}`);

    if (toggles.length > 0) {
      // Simular clique no primeiro toggle
      const firstToggle = toggles[0] as HTMLElement;
      firstToggle.click();
      console.log('✅ Toggle clicado com sucesso');

      setTimeout(() => {
        firstToggle.click(); // Voltar ao estado original
        console.log('✅ Toggle retornado ao estado original');
      }, 500);

      return true;
    }

    return false;
  }

  // Teste 5: Verificar logs de atividade
  function testActivityLogs() {
    console.log('📝 Teste 5: Verificação de logs de atividade');

    const logElements = document.querySelectorAll('[data-testid="activity-log"], .log-entry, .activity-item, .activity-log');
    console.log(`📊 Entradas de log encontradas: ${logElements.length}`);

    // Verificar se há seção de atividade
    const activitySection = Array.from(document.querySelectorAll('*')).find(el =>
      el.textContent && el.textContent.includes('Registro de Atividades')
    );

    if (activitySection) {
      console.log('✅ Seção de atividades encontrada');
      return true;
    } else {
      console.log('❌ Seção de atividades não encontrada');
      return false;
    }
  }

  // Teste 6: Verificar métricas dos agentes
  function testAgentMetrics() {
    console.log('📈 Teste 6: Verificação de métricas dos agentes');

    const metricsElements = document.querySelectorAll('.progress, .chart, [data-testid="agent-metrics"], .metric');
    console.log(`📊 Elementos de métricas encontrados: ${metricsElements.length}`);

    // Procurar por contadores de tarefas
    const taskCounters = Array.from(document.querySelectorAll('*')).filter(el =>
      el.textContent && (el.textContent.includes('tasks completed') || el.textContent.includes('tarefas concluídas'))
    );

    if (taskCounters.length > 0) {
      console.log('✅ Métricas de tarefas encontradas');
      return true;
    } else {
      console.log('❌ Métricas de tarefas não encontradas');
      return false;
    }
  }

  // Teste 7: Verificar botões de ação
  function testActionButtons() {
    console.log('🎯 Teste 7: Verificação de botões de ação');

    const actionButtons = document.querySelectorAll('button:has-text("Executar"), button:has-text("Process"), button:has-text("Run")');
    console.log(`📊 Botões de ação encontrados: ${actionButtons.length}`);

    if (actionButtons.length > 0) {
      console.log('✅ Botões de ação disponíveis');
      return true;
    } else {
      console.log('❌ Nenhum botão de ação encontrado');
      return false;
    }
  }

  // Teste 8: Verificar sistema de backup
  function testBackupSystem() {
    console.log('💾 Teste 8: Verificação do sistema de backup');

    const backupButtons = document.querySelectorAll('button:has-text("Backup"), button:has-text("Salvar")');
    console.log(`📊 Botões de backup encontrados: ${backupButtons.length}`);

    if (backupButtons.length > 0) {
      console.log('✅ Sistema de backup disponível');
      return true;
    } else {
      console.log('❌ Sistema de backup não encontrado');
      return false;
    }
  }

  // Teste 9: Verificar colaboração humano-agente
  function testHumanCollaboration() {
    console.log('🤝 Teste 9: Verificação de colaboração humano-agente');

    const collaborationElements = Array.from(document.querySelectorAll('*')).filter(el =>
      el.textContent && (el.textContent.includes('colaboração') || el.textContent.includes('collaboration') ||
                       el.textContent.includes('Harvey') && el.textContent.includes('Justin-e'))
    );

    if (collaborationElements.length > 0) {
      console.log('✅ Elementos de colaboração encontrados');
      return true;
    } else {
      console.log('❌ Elementos de colaboração não encontrados');
      return false;
    }
  }

  // Teste 10: Verificar orquestração de agentes
  function testAgentOrchestration() {
    console.log('🎼 Teste 10: Verificação de orquestração de agentes');

    const orchestrationElements = Array.from(document.querySelectorAll('*')).filter(el =>
      el.textContent && (el.textContent.includes('orquestração') || el.textContent.includes('orchestration') ||
                       el.textContent.includes('workflow'))
    );

    if (orchestrationElements.length > 0) {
      console.log('✅ Elementos de orquestração encontrados');
      return true;
    } else {
      console.log('❌ Elementos de orquestração não encontrados');
      return false;
    }
  }

  // Executar todos os testes
  function runAllTests() {
    console.log('🧪 Executando bateria completa de testes da UI dos Agentes IA\n');

    const tests = [
      { name: 'Carregamento da Página', func: testPageLoad },
      { name: 'Visibilidade dos Agentes', func: testAgentsVisibility },
      { name: 'Status dos Agentes', func: testAgentStatus },
      { name: 'Controles de Toggle', func: testToggleControls },
      { name: 'Logs de Atividade', func: testActivityLogs },
      { name: 'Métricas dos Agentes', func: testAgentMetrics },
      { name: 'Botões de Ação', func: testActionButtons },
      { name: 'Sistema de Backup', func: testBackupSystem },
      { name: 'Colaboração Humano-Agente', func: testHumanCollaboration },
      { name: 'Orquestração de Agentes', func: testAgentOrchestration }
    ];

    let passedTests = 0;
    let totalTests = tests.length;

    tests.forEach((test, index) => {
      console.log(`\n${index + 1}. ${test.name}`);
      console.log('─'.repeat(50));

      try {
        const result = test.func();
        if (result) {
          passedTests++;
          console.log(`✅ ${test.name}: APROVADO`);
        } else {
          console.log(`❌ ${test.name}: REPROVADO`);
        }
      } catch (error) {
        console.log(`❌ ${test.name}: ERRO - ${error.message}`);
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log(`📊 RESULTADO FINAL: ${passedTests}/${totalTests} testes aprovados`);
    console.log('='.repeat(60));

    if (passedTests === totalTests) {
      console.log('🎉 Todos os testes passaram! A UI dos agentes está funcionando corretamente.');
    } else if (passedTests >= totalTests * 0.8) {
      console.log('⚠️ A maioria dos testes passou. Alguns recursos podem precisar de ajustes.');
    } else {
      console.log('🚨 Muitos testes falharam. A UI dos agentes precisa de atenção.');
    }
  }

  // Aguardar carregamento da página
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
  } else {
    runAllTests();
  }

  // Expor função para execução manual
  window.runAgentUITests = runAllTests;

  console.log('\n💡 Para executar os testes novamente, use: runAgentUITests()');

})();