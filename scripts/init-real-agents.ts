/**
 * Script de Inicialização dos Agentes Reais
 * Configura Spark KV com dados reais do advogado e ativa os agentes de IA
 * 
 * Uso: npx tsx scripts/init-real-agents.ts
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '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';
const BASE_URL = 'https://assistente-jurdico-p.vercel.app';

interface Agent {
  id: string;
  name: string;
  type: 'monitor' | 'analyzer' | 'calculator' | 'writer' | 'researcher' | 'strategic' | 'calendar';
  enabled: boolean;
  status: 'active' | 'idle' | 'paused';
  capabilities: string[];
  lastActivity: string | null;
  tasksCompleted: number;
  autonomyLevel: number;
}

interface MonitoredLawyer {
  id: string;
  name: string;
  oab: string;
  email: string;
  tribunals: string[];
  enabled: boolean;
}

async function putKV(key: string, value: unknown) {
  // Usar endpoint /api/kv que aceita POST com operação set
  const response = await fetch(`${BASE_URL}/api/kv`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      key,
      value,
      operation: 'set'
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to put ${key}: ${response.status} ${text}`);
  }

  return response.json();
}

async function getKV(key: string) {
  const response = await fetch(`${BASE_URL}/api/kv?key=${key}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get ${key}: ${response.status}`);
  }

  return response.json();
}

async function initializeAgents() {
  console.log('🤖 Inicializando Agentes de IA...\n');

  const agents: Agent[] = [
    {
      id: 'agent-djen-monitor',
      name: 'Agente de Monitoramento DJEN',
      type: 'monitor',
      enabled: true,
      status: 'active',
      capabilities: [
        'Monitoramento 24/7',
        'Detecção de publicações',
        'Alertas em tempo real',
        'Análise de relevância'
      ],
      lastActivity: null,
      tasksCompleted: 0,
      autonomyLevel: 0.92,
    },
    {
      id: 'agent-deadline-calculator',
      name: 'Agente Calculador de Prazos',
      type: 'calculator',
      enabled: true,
      status: 'active',
      capabilities: [
        'Cálculo de prazos processuais',
        'Considera feriados e recessos',
        'Alertas de vencimento',
        'Análise de urgência'
      ],
      lastActivity: null,
      tasksCompleted: 0,
      autonomyLevel: 0.88,
    },
    {
      id: 'agent-document-analyzer',
      name: 'Agente Analisador de Documentos',
      type: 'analyzer',
      enabled: true,
      status: 'active',
      capabilities: [
        'Análise de petições',
        'Extração de dados',
        'Identificação de prazos',
        'Resumo automático'
      ],
      lastActivity: null,
      tasksCompleted: 0,
      autonomyLevel: 0.85,
    },
    {
      id: 'agent-legal-writer',
      name: 'Agente Redator Jurídico',
      type: 'writer',
      enabled: true,
      status: 'active',
      capabilities: [
        'Redação de peças',
        'Sugestão de teses',
        'Formatação ABNT',
        'Revisão jurídica'
      ],
      lastActivity: null,
      tasksCompleted: 0,
      autonomyLevel: 0.78,
    },
    {
      id: 'agent-jurisprudence-researcher',
      name: 'Agente Pesquisador de Jurisprudência',
      type: 'researcher',
      enabled: true,
      status: 'active',
      capabilities: [
        'Busca de precedentes',
        'Análise de tendências',
        'Resumo de decisões',
        'Recomendações estratégicas'
      ],
      lastActivity: null,
      tasksCompleted: 0,
      autonomyLevel: 0.82,
    },
    {
      id: 'agent-strategic-advisor',
      name: 'Agente Estratégico',
      type: 'strategic',
      enabled: true,
      status: 'active',
      capabilities: [
        'Análise de riscos',
        'Planejamento processual',
        'Probabilidade de êxito',
        'Sugestões táticas'
      ],
      lastActivity: null,
      tasksCompleted: 0,
      autonomyLevel: 0.75,
    },
    {
      id: 'agent-calendar-sync',
      name: 'Agente de Sincronização de Agenda',
      type: 'calendar',
      enabled: true,
      status: 'active',
      capabilities: [
        'Sincronização Google Calendar',
        'Lembretes automáticos',
        'Gestão de compromissos',
        'Alertas de audiências'
      ],
      lastActivity: null,
      tasksCompleted: 0,
      autonomyLevel: 0.90,
    },
  ];

  try {
    const result = await putKV('autonomous-agents', agents);
    console.log('✅ Agentes criados com sucesso!');
    console.log(`   Total: ${agents.length} agentes ativos\n`);
    return result;
  } catch (error) {
    console.error('❌ Erro ao criar agentes:', error);
    throw error;
  }
}

async function initializeLawyers() {
  console.log('👨‍⚖️ Configurando Advogado...\n');

    const lawyers: MonitoredLawyer[] = [
    {
      id: 'lawyer-thiago-bodevan',
      name: 'Thiago Bodevan Veiga',
      oab: 'OAB/MG 184.404',
      email: 'thiagobodevan@gmail.com',
      tribunals: [
        'TJMG',      // Tribunal de Justiça de Minas Gerais (1ª e 2ª instâncias)
        'TRT3',      // Tribunal Regional do Trabalho 3ª Região (MG) (1ª e 2ª instâncias)
        'TST',       // Tribunal Superior do Trabalho
        'STJ',       // Superior Tribunal de Justiça
      ],
      enabled: true,
    },
  ];  try {
    const result = await putKV('monitored-lawyers', lawyers);
    console.log('✅ Advogado configurado com sucesso!');
    console.log(`   Nome: ${lawyers[0].name}`);
    console.log(`   OAB: ${lawyers[0].oab}`);
    console.log(`   Tribunais: ${lawyers[0].tribunals.join(', ')}\n`);
    return result;
  } catch (error) {
    console.error('❌ Erro ao configurar advogado:', error);
    throw error;
  }
}

async function initializeTaskQueue() {
  console.log('📋 Inicializando Fila de Tarefas...\n');

  const initialTasks: unknown[] = [];

  try {
    const result = await putKV('agent-task-queue', initialTasks);
    console.log('✅ Fila de tarefas inicializada (vazia)\n');
    return result;
  } catch (error) {
    console.error('❌ Erro ao inicializar fila:', error);
    throw error;
  }
}

async function initializeCompletedTasks() {
  console.log('✅ Inicializando Histórico de Tarefas Completadas...\n');

  const completedTasks: unknown[] = [];

  try {
    const result = await putKV('completed-agent-tasks', completedTasks);
    console.log('✅ Histórico inicializado (vazio)\n');
    return result;
  } catch (error) {
    console.error('❌ Erro ao inicializar histórico:', error);
    throw error;
  }
}

async function verifyConfiguration() {
  console.log('🔍 Verificando Configuração...\n');

  try {
    const agents = await getKV('autonomous-agents');
    const lawyers = await getKV('monitored-lawyers');
    const queue = await getKV('agent-task-queue');
    const completed = await getKV('completed-agent-tasks');

    console.log('📊 Status do Spark KV:');
    console.log(`   ✅ Agentes: ${agents.value?.length || 0} configurados`);
    console.log(`   ✅ Advogados: ${lawyers.value?.length || 0} configurados`);
    console.log(`   ✅ Fila: ${queue.value?.length || 0} tarefas`);
    console.log(`   ✅ Histórico: ${completed.value?.length || 0} tarefas completadas\n`);

    return {
      agents: agents.value,
      lawyers: lawyers.value,
      queue: queue.value,
      completed: completed.value,
    };
  } catch (error) {
    console.error('❌ Erro ao verificar configuração:', error);
    throw error;
  }
}

async function testDJENEndpoint() {
  console.log('🧪 Testando Endpoint DJEN Monitor...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/cron/djen-monitor`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer vercel-cron-token',
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ DJEN Monitor está funcional!');
      console.log(`   Advogados verificados: ${data.result?.lawyersChecked || 0}`);
      console.log(`   Tribunais: ${data.result?.tribunaisChecked?.join(', ') || 'N/A'}\n`);
    } else {
      console.log('⚠️ DJEN Monitor retornou erro:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Mensagem: ${data.error || data.message}\n`);
    }

    return data;
  } catch (error) {
    console.error('❌ Erro ao testar DJEN:', error);
    return null;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   🚀 INICIALIZAÇÃO DE AGENTES REAIS - ASSISTENTE PJe');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // 1. Inicializar agentes
    await initializeAgents();

    // 2. Configurar advogado
    await initializeLawyers();

    // 3. Inicializar fila de tarefas
    await initializeTaskQueue();

    // 4. Inicializar histórico
    await initializeCompletedTasks();

    // 5. Verificar configuração
    const config = await verifyConfiguration();

    // 6. Testar endpoint DJEN
    await testDJENEndpoint();

    console.log('═══════════════════════════════════════════════════════');
    console.log('   ✅ INICIALIZAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📝 Próximos Passos:');
    console.log('   1. Adicione seu email em monitored-lawyers para receber notificações');
    console.log('   2. Aguarde execução do cron job DJEN (9h diariamente)');
    console.log('   3. Acompanhe os logs em: vercel logs assistente-jurdico-p');
    console.log('   4. Verifique a interface para ver agentes ativos\n');

    console.log('🔗 Links Úteis:');
    console.log(`   Dashboard: ${BASE_URL}`);
    console.log(`   API Health: ${BASE_URL}/api/health`);
    console.log(`   Vercel Dashboard: https://vercel.com/thiagos-projects-9834ca6f/assistente-jurdico-p\n`);

  } catch (error) {
    console.error('\n❌ ERRO FATAL NA INICIALIZAÇÃO:');
    console.error(error);
    process.exit(1);
  }
}

// Executar
main();
