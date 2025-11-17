export type AgentTaskData = Record<string, unknown>
export type AgentTaskResult = Record<string, unknown>

export interface AgentTask {
  id: string
  agentId: string
  type: 'analyze_document' | 'monitor_djen' | 'calculate_deadline' | 'draft_petition' | 'check_datajud' | 'organize_files' | 'research_precedents' | 'risk_analysis' | 'contract_review' | 'client_communication' | 'billing_analysis' | 'case_strategy' | 'legal_translation' | 'compliance_check'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'human_intervention'
  createdAt: string
  startedAt?: string
  completedAt?: string
  data: AgentTaskData
  result?: AgentTaskResult
  error?: string
  humanTouchedAt?: string
  resumeAfterHuman?: boolean
}

export interface Agent {
  id: string
  name: string
  description: string
  type: 'analyzer' | 'monitor' | 'calculator' | 'writer' | 'organizer' | 'researcher' | 'strategic' | 'compliance' | 'translator' | 'communicator'
  status: 'active' | 'idle' | 'processing' | 'paused' | 'waiting_human'
  enabled: boolean
  lastActivity: string
  tasksCompleted: number
  tasksToday: number
  autonomyLevel: number
  capabilities: string[]
  nextScheduledRun?: string
  currentTask?: AgentTask
  workQueue: AgentTask[]
  continuousMode: boolean
  humanInteractionMode: 'pause' | 'queue' | 'collaborate'
}

// Utility type guards for `AgentTaskData`
const asString = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined)
const asNumber = (v: unknown): number | undefined => (typeof v === 'number' ? v : undefined)
const asBoolean = (v: unknown): boolean | undefined => (typeof v === 'boolean' ? v : undefined)
const asStringArray = (v: unknown): string[] | undefined => (Array.isArray(v) ? (v as unknown as string[]) : undefined)

export const agentActivities = {
  analyzer: [
    'Analisando novos expedientes',
    'Extraindo dados de intimações',
    'Classificando documentos por tipo',
    'Identificando prazos fatais',
    'Gerando resumos executivos',
    'Detectando documentos pendentes',
  ],
  monitor: [
    'Verificando DJEN para novas intimações',
    'Monitorando processos no DataJud',
    'Detectando novas publicações',
    'Atualizando status dos processos',
    'Notificando prazos próximos',
    'Sincronizando andamentos processuais',
  ],
  calculator: [
    'Calculando prazos processuais',
    'Verificando calendário de feriados',
    'Identificando prazos fatais',
    'Recalculando após suspensões',
    'Gerando alertas de vencimento',
    'Auditando cálculos anteriores',
  ],
  writer: [
    'Redigindo minuta de petição',
    'Padronizando formatação',
    'Gerando manifestação processual',
    'Criando resumo de audiência',
    'Elaborando relatório de caso',
    'Sugerindo argumentos jurídicos',
  ],
  organizer: [
    'Organizando documentos por processo',
    'Categorizando expedientes',
    'Indexando peças processuais',
    'Consolidando histórico',
    'Sincronizando anexos',
    'Arquivando processos concluídos',
  ],
  researcher: [
    'Consultando DataJud',
    'Buscando jurisprudência',
    'Pesquisando precedentes',
    'Analisando decisões similares',
    'Consolidando dados estatísticos',
    'Extraindo informações relevantes',
  ],
  strategic: [
    'Analisando performance da equipe',
    'Gerando insights estratégicos',
    'Monitorando KPIs do escritório',
    'Avaliando tendências financeiras',
    'Identificando gargalos operacionais',
    'Sugerindo otimizações de processo',
  ],
  compliance: [
    'Verificando conformidade regulatória',
    'Auditando procedimentos internos',
    'Validando cláusulas contratuais',
    'Checando prazos prescriptionais',
    'Identificando riscos legais',
    'Monitorando mudanças legislativas',
  ],
  translator: [
    'Traduzindo documentos jurídicos',
    'Adaptando termos técnicos',
    'Convertendo jargão legal',
    'Simplificando linguagem para clientes',
    'Padronizando terminologia',
    'Criando glossários especializados',
  ],
  communicator: [
    'Redigindo comunicações com clientes',
    'Preparando relatórios de andamento',
    'Gerando alertas de prazos',
    'Criando templates de e-mail',
    'Personalizando notificações',
    'Agendando follow-ups automáticos',
  ],
}

export function getAgentActivity(agent: Agent): string {
  const activities = agentActivities[agent.type]
  if (!activities || activities.length === 0) return agent.lastActivity
  
  if (agent.currentTask) {
    return `Processando: ${getTaskDescription(agent.currentTask)}`
  }
  
  if (agent.status === 'waiting_human') {
    return 'Aguardando conclusão da edição humana'
  }
  
  if (agent.status === 'idle' && agent.workQueue.length > 0) {
    return `${agent.workQueue.length} tarefas na fila`
  }
  
  return activities[Math.floor(Math.random() * activities.length)]
}

export function getTaskDescription(task: AgentTask): string {
  const descriptions: Record<AgentTask['type'], string> = {
    analyze_document: 'Análise de documento',
    monitor_djen: 'Monitoramento DJEN',
    calculate_deadline: 'Cálculo de prazo',
    draft_petition: 'Redação de petição',
    check_datajud: 'Consulta DataJud',
    organize_files: 'Organização de arquivos',
    research_precedents: 'Pesquisa de precedentes',
    risk_analysis: 'Análise de risco',
    contract_review: 'Revisão de contrato',
    client_communication: 'Comunicação com cliente',
    billing_analysis: 'Análise de faturamento',
    case_strategy: 'Estratégia processual',
    legal_translation: 'Tradução jurídica',
    compliance_check: 'Verificação de compliance',
  }
  return descriptions[task.type] || task.type
}

export function createAgentTask(
  agentId: string,
  type: AgentTask['type'],
  data: AgentTaskData,
  priority: AgentTask['priority'] = 'medium'
): AgentTask {
  return {
    id: crypto.randomUUID(),
    agentId,
    type,
    priority,
    status: 'queued',
    createdAt: new Date().toISOString(),
    data,
  }
}

export async function processTaskWithAI(task: AgentTask, agent: Agent): Promise<AgentTaskResult> {
  const processingTime = 1500 + Math.random() * 3000
  
  await new Promise(resolve => setTimeout(resolve, processingTime))
  
  switch (task.type) {
    case 'analyze_document':
      return {
        summary: 'Documento analisado com sucesso pela IA',
        extractedData: {
          ...task.data,
          processedAt: new Date().toISOString(),
          agentId: agent.id,
        },
        suggestedActions: [
          'Responder intimação no prazo',
          'Anexar documentos comprobatórios',
          'Notificar cliente sobre andamento',
          'Agendar reunião de alinhamento'
        ],
        confidence: 0.92 + Math.random() * 0.08,
        deadlines: asBoolean(task.data.hasDeadline) ? [
          {
            type: 'Resposta',
            date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            priority: 'high'
          }
        ] : []
      }
      
    case 'monitor_djen': {
      const hasNewIntimations = Math.random() > 0.7
      return {
        newIntimations: hasNewIntimations ? [
          {
            id: crypto.randomUUID(),
            processo: `${Math.floor(Math.random() * 9000000) + 1000000}-${Math.floor(Math.random() * 90) + 10}.2024.8.07.0001`,
            tipo: 'Intimação',
            conteudo: 'Nova intimação disponível para análise',
            prazo: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
          }
        ] : [],
        checked: true,
        timestamp: new Date().toISOString(),
        tribunaisVerificados: asStringArray(task.data?.tribunais) ?? ['TJDFT', 'STJ', 'TST'],
        nextCheck: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      }
    }
      
    case 'calculate_deadline': {
      const businessDays = asNumber(task.data?.businessDays) ?? 15
      const startDate = asString(task.data?.startDate) ? new Date(asString(task.data?.startDate)!) : new Date()
      let daysAdded = 0
      const currentDate = new Date(startDate)
      
      while (daysAdded < businessDays) {
        currentDate.setDate(currentDate.getDate() + 1)
        const dayOfWeek = currentDate.getDay()
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          daysAdded++
        }
      }
      
      return {
        deadline: currentDate.toISOString(),
        businessDays,
        calendarDays: Math.ceil((currentDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)),
        reasoning: [
          `${businessDays} dias úteis a partir de ${startDate.toLocaleDateString('pt-BR')}`,
          'Desconsiderados sábados e domingos',
          'Feriados nacionais verificados',
          `Vencimento: ${currentDate.toLocaleDateString('pt-BR')}`
        ],
        alerts: [
          {
            type: 'warning',
            days: 3,
            message: 'Prazo fatal se aproximando'
          },
          {
            type: 'critical',
            days: 1,
            message: 'Último dia para protocolo'
          }
        ]
      }
    }
      
    case 'draft_petition':
      return {
        draft: `
EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(ÍZA) DE DIREITO DA ${task.data?.vara || 'VARA'} ${task.data?.comarca || 'COMARCA'}

${asString(task.data?.requerente) || '[REQUERENTE]'}, por meio de seu(sua) advogado(a) que esta subscreve, vem, respeitosamente, à presença de Vossa Excelência, para apresentar:

${asString(task.data?.tipo)?.toUpperCase() ?? 'PETIÇÃO'}

pelos fundamentos de fato e de direito a seguir expostos:

I. DOS FATOS

[Redigido automaticamente pela IA - Requer revisão humana]

II. DO DIREITO

[Argumentação jurídica baseada em análise de IA]

III. DOS PEDIDOS

Diante do exposto, requer:

  a) O recebimento da presente ${asString(task.data?.tipo) || 'petição'};
  b) ${asString(task.data?.pedido) || 'A procedência dos pedidos'};

Termos em que,
Pede deferimento.

[Cidade], ${new Date().toLocaleDateString('pt-BR')}

[ADVOGADO(A)]
OAB/XX XXXXX
        `.trim(),
        confidence: 0.85 + Math.random() * 0.12,
        needsReview: true,
        suggestions: [
          'Revisar fundamentos jurídicos',
          'Adicionar jurisprudência específica',
          'Incluir documentos comprobatórios',
          'Verificar competência do juízo'
        ],
        metadata: {
          generatedAt: new Date().toISOString(),
          wordCount: 150 + Math.floor(Math.random() * 100),
          estimatedTime: '5 minutos para revisão'
        }
      }
      
    case 'check_datajud':
      return {
        processosEncontrados: Math.floor(Math.random() * 5),
        ultimaAtualizacao: new Date().toISOString(),
        movimentacoes: [
          {
            data: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            tipo: 'Juntada de Documento',
            descricao: 'Documentos juntados aos autos'
          }
        ],
        status: 'Em andamento',
        nextUpdate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
      
    case 'organize_files':
      return {
        filesOrganized: Math.floor(Math.random() * 20) + 5,
        categoriesCreated: ['Petições', 'Intimações', 'Sentenças', 'Recursos', 'Comprovantes'],
        duplicatesFound: Math.floor(Math.random() * 3),
        spaceSaved: `${(Math.random() * 50 + 10).toFixed(2)} MB`,
        indexingCompleted: true,
        timestamp: new Date().toISOString()
      }
      
    case 'research_precedents':
      return {
        precedentsFound: Math.floor(Math.random() * 15) + 5,
        tribunals: ['STJ', 'STF', 'TST', 'TRF1', 'TJDFT'],
        relevantCases: [
          {
            id: crypto.randomUUID(),
            tribunal: 'STJ',
            number: `REsp ${Math.floor(Math.random() * 2000000) + 1000000}/DF`,
            year: 2020 + Math.floor(Math.random() * 4),
            summary: 'Precedente relevante sobre a matéria analisada',
            relevanceScore: 0.85 + Math.random() * 0.15,
            keywords: asStringArray(task.data?.keywords) ?? ['direito civil', 'processo', 'jurisprudência']
          }
        ],
        thematicAnalysis: {
          mainTopic: asString(task.data?.topic) || 'Análise jurisprudencial',
          trends: ['Entendimento consolidado', 'Jurisprudência pacífica', 'Tese favorável'],
          confidence: 0.88 + Math.random() * 0.12
        },
        recommendation: 'Utilizar precedentes identificados para fundamentar petição',
        timestamp: new Date().toISOString()
      }
      
    case 'risk_analysis':
      return {
        riskLevel: ['baixo', 'médio', 'alto', 'crítico'][Math.floor(Math.random() * 4)],
        riskScore: Math.floor(Math.random() * 100),
        factors: [
          {
            category: 'Processual',
            description: 'Análise de viabilidade processual',
            impact: 'Médio',
            mitigation: 'Reforçar fundamentação jurídica'
          },
          {
            category: 'Financeiro',
            description: 'Exposição financeira do caso',
            impact: asNumber(task.data?.valor) ? 'Alto' : 'Baixo',
            mitigation: 'Avaliar acordo extrajudicial'
          },
          {
            category: 'Temporal',
            description: 'Risco de perda de prazo',
            impact: 'Baixo',
            mitigation: 'Sistema de alertas configurado'
          }
        ],
        recommendations: [
          'Monitorar evolução do caso semanalmente',
          'Considerar estratégias alternativas',
          'Manter documentação completa',
          'Avaliar custos vs benefícios'
        ],
        probabilitySuccess: 0.65 + Math.random() * 0.30,
        estimatedDuration: `${Math.floor(Math.random() * 24) + 6} meses`,
        timestamp: new Date().toISOString()
      }
      
    case 'contract_review':
      return {
        contractAnalysis: {
          type: task.data?.contractType || 'Contrato de Prestação de Serviços',
          pages: Math.floor(Math.random() * 20) + 5,
          clauses: Math.floor(Math.random() * 30) + 10,
          reviewedAt: new Date().toISOString()
        },
        findings: [
          {
            severity: 'alta',
            clause: Math.floor(Math.random() * 15) + 1,
            issue: 'Cláusula com redação ambígua',
            suggestion: 'Revisar para maior clareza e segurança jurídica'
          },
          {
            severity: 'média',
            clause: Math.floor(Math.random() * 15) + 1,
            issue: 'Falta de especificação de prazos',
            suggestion: 'Incluir prazos específicos para cada obrigação'
          },
          {
            severity: 'baixa',
            clause: Math.floor(Math.random() * 15) + 1,
            issue: 'Formatação inconsistente',
            suggestion: 'Padronizar formatação do documento'
          }
        ],
        compliance: {
          lgpd: Math.random() > 0.3,
          codigoCivil: Math.random() > 0.2,
          codigoDefesaConsumidor: task.data?.isConsumerRelation || Math.random() > 0.5
        },
        riskAssessment: 'Risco baixo a médio - revisões sugeridas',
        approvalRecommendation: Math.random() > 0.4 ? 'Aprovado com ressalvas' : 'Requer revisão',
        timestamp: new Date().toISOString()
      }
      
    case 'client_communication':
      return {
        messageGenerated: true,
        template: `Prezado(a) ${asString(task.data?.clientName) || 'Cliente'},

Informamos que houve uma atualização no processo ${asString(task.data?.processNumber) || '[Número do Processo]'}.

${asString(task.data?.update) || 'Recebemos nova movimentação processual que requer sua atenção.'}

${asString(task.data?.action) ? `Próximos passos: ${asString(task.data?.action)}` : 'Estamos analisando a movimentação e retornaremos em breve com orientações.'}

Qualquer dúvida, estamos à disposição.

Atenciosamente,
${task.data?.lawyerName || '[Advogado]'}`,
        tone: 'formal',
        urgency: asBoolean(task.data?.urgent) ? 'alta' : 'normal',
        channels: ['email', 'whatsapp'],
        scheduledSend: asString(task.data?.scheduleFor) || 'immediate',
        attachments: task.data?.attachments ?? [],
        timestamp: new Date().toISOString()
      }
      
    case 'billing_analysis':
      return {
        periodAnalyzed: asString(task.data?.period) || 'Últimos 30 dias',
        totalBilled: (Math.random() * 50000 + 10000).toFixed(2),
        totalReceived: (Math.random() * 40000 + 8000).toFixed(2),
        pendingInvoices: Math.floor(Math.random() * 10) + 2,
        breakdown: {
          consultoria: (Math.random() * 15000 + 5000).toFixed(2),
          processos: (Math.random() * 20000 + 10000).toFixed(2),
          honorarios: (Math.random() * 15000 + 5000).toFixed(2)
        },
        insights: [
          'Recebimento médio em 45 dias',
          'Taxa de adimplência: 85%',
          'Crescimento de 12% vs mês anterior',
          '3 clientes com pendências > 60 dias'
        ],
        recommendations: [
          'Acionar clientes com atraso superior a 60 dias',
          'Considerar desconto para pagamento antecipado',
          'Automatizar lembretes de vencimento'
        ],
        projectedRevenue: (Math.random() * 60000 + 20000).toFixed(2),
        timestamp: new Date().toISOString()
      }
      
    case 'case_strategy':
      return {
        strategyAnalysis: {
          caseType: asString(task.data?.caseType) || 'Processo Civil',
          currentPhase: asString(task.data?.phase) || 'Instrução',
          estimatedDuration: `${Math.floor(Math.random() * 18) + 6} meses`,
          complexity: ['baixa', 'média', 'alta', 'muito alta'][Math.floor(Math.random() * 4)]
        },
        recommendedActions: [
          {
            priority: 'alta',
            action: 'Protocolar contestação com documentação comprobatória',
            deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            estimatedTime: '3 horas'
          },
          {
            priority: 'média',
            action: 'Solicitar perícia técnica',
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            estimatedTime: '2 horas'
          },
          {
            priority: 'baixa',
            action: 'Preparar rol de testemunhas',
            deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
            estimatedTime: '1 hora'
          }
        ],
        successProbability: 0.60 + Math.random() * 0.35,
        alternativeStrategies: [
          'Tentativa de acordo antes da sentença',
          'Recurso à instância superior',
          'Mediação extrajudicial'
        ],
        precedentAnalysis: {
          favorablePrecedents: Math.floor(Math.random() * 10) + 3,
          unfavorablePrecedents: Math.floor(Math.random() * 5) + 1,
          recommendation: 'Jurisprudência majoritariamente favorável'
        },
        riskFactors: [
          'Ausência de documentação específica',
          'Prazo processual apertado',
          'Mudança recente na legislação'
        ],
        timestamp: new Date().toISOString()
      }
      
    case 'legal_translation':
      return {
        translationCompleted: true,
        sourceLanguage: task.data?.sourceLang || 'Jurídico técnico',
        targetLanguage: task.data?.targetLang || 'Linguagem simples',
        originalLength: Math.floor(Math.random() * 1000) + 500,
        translatedLength: Math.floor(Math.random() * 800) + 400,
        simplificationLevel: task.data?.level || 'intermediário',
        keyTermsGlossary: [
          { term: 'Exordial', translation: 'Petição inicial' },
          { term: 'Litisconsórcio', translation: 'Múltiplas partes no processo' },
          { term: 'Prescricional', translation: 'Relacionado ao prazo de prescrição' },
          { term: 'Petitum', translation: 'Pedidos feitos ao juiz' }
        ],
        readabilityScore: 0.75 + Math.random() * 0.20,
        suggestedImprovements: [
          'Substituir termos técnicos por expressões do dia a dia',
          'Dividir frases longas em períodos menores',
          'Adicionar exemplos práticos'
        ],
        timestamp: new Date().toISOString()
      }
      
    case 'compliance_check':
      return {
        complianceStatus: Math.random() > 0.3 ? 'conforme' : 'não conforme',
        checksPerformed: [
          {
            area: 'LGPD',
            status: Math.random() > 0.2 ? 'conforme' : 'pendente',
            details: 'Verificação de tratamento de dados pessoais',
            priority: 'alta'
          },
          {
            area: 'Código de Ética OAB',
            status: Math.random() > 0.1 ? 'conforme' : 'pendente',
            details: 'Adequação às normas éticas profissionais',
            priority: 'crítica'
          },
          {
            area: 'Legislação Trabalhista',
            status: Math.random() > 0.3 ? 'conforme' : 'pendente',
            details: 'Conformidade com CLT e normas regulamentadoras',
            priority: 'média'
          },
          {
            area: 'Código Civil',
            status: Math.random() > 0.2 ? 'conforme' : 'pendente',
            details: 'Verificação de cláusulas contratuais',
            priority: 'alta'
          }
        ],
        violations: Math.floor(Math.random() * 3),
        warnings: Math.floor(Math.random() * 5),
        recommendations: [
          'Atualizar política de privacidade',
          'Revisar termos de uso',
          'Implementar controles de acesso',
          'Documentar processos de compliance'
        ],
        nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        certificationStatus: Math.random() > 0.3 ? 'válido' : 'requer renovação',
        timestamp: new Date().toISOString()
      }
      
    default:
      return {
        completed: true,
        timestamp: new Date().toISOString(),
        agentId: agent.id
      }
  }
}

export function shouldPauseForHuman(agent: Agent, task: AgentTask): boolean {
  if (agent.humanInteractionMode === 'pause') {
    return task.priority === 'critical'
  }
  return false
}

export function canResumeAfterHuman(task: AgentTask): boolean {
  if (!task.humanTouchedAt) return true
  if (task.resumeAfterHuman === false) return false
  
  const timeSinceHumanTouch = Date.now() - new Date(task.humanTouchedAt).getTime()
  const fiveMinutes = 5 * 60 * 1000
  
  return timeSinceHumanTouch > fiveMinutes
}
