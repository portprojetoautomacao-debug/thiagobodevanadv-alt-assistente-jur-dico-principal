import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Endpoint para inicializar configuração dos agentes e advogado monitorado
 * POST /api/init-config
 * 
 * Este endpoint popula o Spark KV com a configuração inicial:
 * - 7 agentes autônomos
 * - Dados do advogado Thiago Bodevan Veiga
 * - Filas de tarefas vazias
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Apenas POST permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
      oab: '184404/MG',
      email: 'thiagobodevanadvocacia@gmail.com',
      tribunals: ['TJMG', 'TRT3', 'TST', 'STJ', 'TRF1'],
      enabled: true,
    };

    // Salvar no Spark KV
    const kvUrl = '/_spark/kv';
    const baseUrl = `https://${req.headers.host}`;

    // Função helper para salvar no KV
    const saveToKV = async (key: string, value: any) => {
      const response = await fetch(`${baseUrl}${kvUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          value: JSON.stringify(value),
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save ${key}: ${response.statusText}`);
      }
      
      return response.json();
    };

    // Salvar todas as chaves
    await Promise.all([
      saveToKV('autonomous-agents', agentes),
      saveToKV('monitored-lawyers', [advogado]),
      saveToKV('agent-task-queue', []),
      saveToKV('completed-agent-tasks', []),
    ]);

    return res.status(200).json({
      ok: true,
      message: 'Configuração inicializada com sucesso!',
      data: {
        agentes: agentes.length,
        advogado: {
          name: advogado.name,
          oab: advogado.oab,
          email: advogado.email,
          tribunals: advogado.tribunals,
        },
        keys: [
          'autonomous-agents',
          'monitored-lawyers',
          'agent-task-queue',
          'completed-agent-tasks',
        ],
      },
    });
  } catch (error) {
    console.error('Error initializing config:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to initialize configuration',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
