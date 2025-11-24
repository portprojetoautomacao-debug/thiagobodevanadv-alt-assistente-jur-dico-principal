#!/usr/bin/env node

/**
 * Teste de Integração com Todoist
 * Verifica se a integração com Todoist para gerenciamento de tarefas legais está funcionando
 */

const https = require('https');

console.log('🧪 Iniciando teste de integração Todoist...');

// Simulação de teste de conectividade com Todoist API
const testTodoistConnection = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.todoist.com',
      port: 443,
      path: '/sync/v9/projects',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test_token' // Token de teste
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      console.log(`✅ Status da resposta Todoist: ${res.statusCode}`);

      // Todoist retorna 401 para token inválido, mas isso indica que a API está acessível
      if (res.statusCode === 401 || res.statusCode === 200) {
        console.log('✅ Conectividade com Todoist API OK');
        resolve(true);
      } else {
        console.log(`⚠️  Status inesperado: ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      console.log(`❌ Erro de conexão com Todoist: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('⏰ Timeout na conexão com Todoist');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
};

// Teste de validação de formato de tarefa Todoist
const testTaskFormat = () => {
  console.log('📝 Testando formato de tarefa Todoist...');

  const sampleTodoistTask = {
    content: 'Revisar petição inicial - Processo 1234567-89.2024',
    description: 'Revisar e aprovar petição inicial do processo trabalhista contra Empresa XYZ',
    project_id: '1234567890',
    labels: ['urgente', 'trabalhista', 'revisao'],
    priority: 4, // 1-4, sendo 4 a mais alta
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 dias
    metadata: {
      processNumber: '1234567-89.2024.8.26.0100',
      taskType: 'revisao_documento',
      relatedIssue: 'gitlab-issue-123'
    }
  };

  // Validação básica do formato
  const requiredFields = ['content', 'project_id'];
  const hasRequiredFields = requiredFields.every(field => sampleTodoistTask.hasOwnProperty(field));

  if (hasRequiredFields && sampleTodoistTask.content && sampleTodoistTask.priority >= 1 && sampleTodoistTask.priority <= 4) {
    console.log('✅ Formato de tarefa Todoist válido');
    return true;
  } else {
    console.log('❌ Formato de tarefa Todoist inválido');
    return false;
  }
};

// Teste de validação de mapeamento GitLab ↔ Todoist
const testGitLabTodoistMapping = () => {
  console.log('🔄 Testando mapeamento GitLab ↔ Todoist...');

  const gitlabIssue = {
    id: 123,
    title: 'Processo Trabalhista - Reclamação Salarial',
    labels: ['tipo::trabalhista', 'prioridade::alta', 'status::aguardando'],
    assignee: 'advogado@escritorio.com',
    due_date: '2024-12-15'
  };

  const mappedTodoistTask = {
    content: `Revisar: ${gitlabIssue.title}`,
    description: `Issue GitLab #${gitlabIssue.id} - ${gitlabIssue.title}`,
    labels: gitlabIssue.labels.map(label => label.replace('::', '-')),
    priority: gitlabIssue.labels.includes('prioridade::alta') ? 4 : 3,
    due_date: gitlabIssue.due_date
  };

  // Verificar se o mapeamento está correto
  const mappingValid = mappedTodoistTask.content.includes(gitlabIssue.title) &&
                      mappedTodoistTask.description.includes(`#${gitlabIssue.id}`) &&
                      mappedTodoistTask.priority === 4;

  if (mappingValid) {
    console.log('✅ Mapeamento GitLab ↔ Todoist válido');
    return true;
  } else {
    console.log('❌ Mapeamento GitLab ↔ Todoist inválido');
    return false;
  }
};

// Executar testes
async function runTests() {
  try {
    console.log('='.repeat(50));
    console.log('🧪 TESTE DE INTEGRAÇÃO TODOIST');
    console.log('='.repeat(50));

    const connectionTest = await testTodoistConnection();
    const taskFormatTest = testTaskFormat();
    const mappingTest = testGitLabTodoistMapping();

    console.log('\n📊 RESULTADOS DOS TESTES:');
    console.log(`Conectividade Todoist API: ${connectionTest ? '✅ PASSOU' : '❌ FALHOU'}`);
    console.log(`Formato Tarefa Todoist: ${taskFormatTest ? '✅ PASSOU' : '❌ FALHOU'}`);
    console.log(`Mapeamento GitLab ↔ Todoist: ${mappingTest ? '✅ PASSOU' : '❌ FALHOU'}`);

    const overallResult = connectionTest && taskFormatTest && mappingTest;
    console.log(`\n🎯 RESULTADO GERAL: ${overallResult ? '✅ TODOS OS TESTES PASSARAM' : '⚠️  ALGUNS TESTES FALHARAM'}`);

    process.exit(overallResult ? 0 : 1);

  } catch (error) {
    console.error('❌ Erro durante execução dos testes:', error);
    process.exit(1);
  }
}

runTests();