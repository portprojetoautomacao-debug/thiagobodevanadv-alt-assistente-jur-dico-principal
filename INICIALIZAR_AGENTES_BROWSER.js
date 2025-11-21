// Script para inicializar agentes - Cole no Console do navegador
// Acesse: https://assistente-jurdico-p.vercel.app
// Abra o DevTools (F12) e cole este código no Console

const agentes = [
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

const advogado = {
  id: 'lawyer-thiago-bodevan',
  name: 'Thiago Bodevan Veiga',
  oab: 'OAB/MG 184.404',
  email: 'thiagobodevanadvocacia@gmail.com',
  tribunals: ['TJMG', 'TRT3', 'TST', 'STJ'],
  enabled: true,
};

// Salvar no localStorage (será sincronizado com Spark KV automaticamente)
localStorage.setItem('autonomous-agents', JSON.stringify(agentes));
localStorage.setItem('monitored-lawyers', JSON.stringify([advogado]));
localStorage.setItem('agent-task-queue', JSON.stringify([]));
localStorage.setItem('completed-agent-tasks', JSON.stringify([]));

console.log('✅ Agentes inicializados com sucesso!');
console.log(`✅ ${agentes.length} agentes configurados`);
console.log(`✅ Advogado: ${advogado.name} (${advogado.oab})`);
console.log('🔄 Recarregue a página (F5) para ver os agentes ativos!');
