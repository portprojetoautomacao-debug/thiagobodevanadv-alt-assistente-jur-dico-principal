/**
 * API Endpoint para processar tarefas individuais com IA real
 * Path: /api/agents/process-task
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { AgentTask } from '@/lib/agents';

function getSystemPrompt(agentType: string): string {
  const prompts: Record<string, string> = {
    analyzer: `Você é um assistente jurídico especializado em análise de documentos processuais.
Sua função é extrair informações críticas de documentos jurídicos, identificar prazos, partes envolvidas, e sugerir ações.
Sempre retorne respostas em formato JSON estruturado.`,

    monitor: `Você é um agente de monitoramento de publicações jurídicas especializadoem DJEN e DataJud.
Analise intimações, extraia dados do processo, identifique prazos e classifique a urgência.
Retorne sempre em JSON com campos: processo, tipo, prazo, urgência.`,

    calculator: `Você é um especialista em cálculo de prazos processuais segundo o CPC/2015.
Considere: dias úteis, feriados nacionais e estaduais, suspensões de prazos, recesso forense.
Retorne JSON com: deadline (ISO date), businessDays, reasoning (array).`,

    writer: `Você é um redator jurídico sênior especializado em peças processuais.
Redija petições, manifestações e documentos jurídicos com linguagem técnica, formal e persuasiva.
Siga normas ABNT, formatação padrão, e fundamente juridicamente.`,

    researcher: `Você é um pesquisador jurídico especializado em jurisprudência e doutrina.
Busque precedentes, analise tendências jurisprudenciais, identifique teses vencedoras.
Retorne JSON com: precedentsFound, relevantCases, thematicAnalysis.`,

    strategic: `Você é um estrategista jurídico com visão de negócios.
Analise casos sob perspectiva estratégica, identifique riscos, oportunidades e probabilidades de sucesso.
Retorne JSON com: riskLevel, successProbability, recommendations.`,

    organizer: `Você é um especialista em organização e gestão de documentos jurídicos.
Classifique documentos por tipo, processo, data e relevância.
Retorne JSON com: categories, filesOrganized, indexingStrategy.`,

    compliance: `Você é um especialista em compliance jurídico e regulatório.
Verifique conformidade com LGPD, Código de Ética OAB, legislação trabalhista e civil.
Retorne JSON com: complianceStatus, violations, recommendations.`,

    translator: `Você é um especialista em tradução de jargão jurídico para linguagem acessível.
Simplifique termos técnicos mantendo precisão jurídica.
Retorne JSON com: simplifiedText, glossary, readabilityScore.`,

    communicator: `Você é um especialista em comunicação com clientes jurídicos.
Redija comunicações claras, empáticas e profissionais.
Retorne JSON com: messageText, tone, channels, urgency.`,
  };

  return prompts[agentType] || 'Você é um assistente jurídico inteligente.';
}

function getUserPrompt(task: AgentTask): string {
  const taskDescriptions: Record<AgentTask['type'], (data: any) => string> = {
    analyze_document: (data) => `Analise o seguinte documento jurídico:

${JSON.stringify(data, null, 2)}

Extraia e retorne em JSON:
- summary: resumo executivo
- extractedData: dados estruturados (partes, processo, tipo)
- suggestedActions: array de ações recomendadas
- deadlines: array de prazos identificados (tipo, data, prioridade)
- confidence: nível de confiança (0-1)`,

    monitor_djen: (data) => `Verifique publicações no DJEN/DataJud para:

Tribunais: ${data.tribunais?.join(', ') || 'TJDFT, STJ, TST'}
Advogado: ${data.lawyerName || 'Não especificado'}
OAB: ${data.oab || 'Não especificada'}

Retorne em JSON:
- newIntimations: array de novas intimações encontradas
- checked: boolean
- tribunaisVerificados: array
- nextCheck: próximo horário de verificação (ISO date)`,

    calculate_deadline: (data) => `Calcule o prazo processual com os seguintes parâmetros:

Data inicial: ${data.startDate || new Date().toISOString()}
Dias úteis: ${data.businessDays || 15}
Tribunal: ${data.tribunalCode || 'TJDFT'}
Tipo de prazo: ${data.deadlineType || 'Resposta'}

Retorne em JSON:
- deadline: data final (ISO date)
- businessDays: dias úteis contados
- calendarDays: dias corridos
- reasoning: array explicando o cálculo
- holidays: feriados considerados
- alerts: array de alertas (3 dias antes, 1 dia antes)`,

    draft_petition: (data) => `Redija uma peça processual com as seguintes informações:

Tipo: ${data.tipo || 'Petição Inicial'}
Vara: ${data.vara || 'Vara Cível'}
Comarca: ${data.comarca || 'Brasília/DF'}
Requerente: ${data.requerente || '[REQUERENTE]'}
Pedido: ${data.pedido || '[ESPECIFICAR PEDIDO]'}

${data.context ? `Contexto adicional:\n${data.context}` : ''}

Retorne em JSON:
- draft: texto completo da petição formatado
- confidence: nível de confiança (0-1)
- needsReview: boolean indicando se precisa revisão humana
- suggestions: array de sugestões de melhoria
- metadata: {wordCount, estimatedTime}`,

    check_datajud: (data) => `Consulte o DataJud para:

Número do processo: ${data.processNumber}
Tribunal: ${data.tribunal || 'TJDFT'}

Retorne em JSON:
- processosEncontrados: número de resultados
- ultimaAtualizacao: timestamp
- movimentacoes: array de movimentações recentes
- status: status atual do processo
- partes: partes envolvidas`,

    organize_files: (data) => `Organize os seguintes arquivos/documentos:

${JSON.stringify(data.files || [], null, 2)}

Retorne em JSON:
- filesOrganized: número de arquivos organizados
- categoriesCreated: array de categorias criadas
- duplicatesFound: número de duplicatas
- spaceSaved: espaço economizado
- indexingCompleted: boolean`,

    research_precedents: (data) => `Pesquise precedentes jurídicos sobre:

Tema: ${data.topic || 'Análise jurisprudencial'}
Palavras-chave: ${data.keywords?.join(', ') || 'processo civil'}
Tribunais: ${data.tribunals?.join(', ') || 'STJ, STF, TST'}

Retorne em JSON:
- precedentsFound: número de precedentes
- tribunals: array de tribunais consultados
- relevantCases: array de casos relevantes (tribunal, número, ano, summary, relevanceScore)
- thematicAnalysis: {mainTopic, trends, confidence}
- recommendation: recomendação de uso`,

    risk_analysis: (data) => `Analise os riscos do seguinte caso:

Tipo de caso: ${data.caseType || 'Processo Civil'}
Valor da causa: ${data.valor || 'Não especificado'}
Complexidade: ${data.complexity || 'Média'}

${data.context ? `Contexto:\n${data.context}` : ''}

Retorne em JSON:
- riskLevel: baixo|médio|alto|crítico
- riskScore: 0-100
- factors: array de fatores de risco {category, description, impact, mitigation}
- recommendations: array de recomendações
- probabilitySuccess: 0-1
- estimatedDuration: estimativa em meses`,

    contract_review: (data) => `Revise o seguinte contrato:

Tipo: ${data.contractType || 'Prestação de Serviços'}
${data.contractText ? `Texto:\n${data.contractText}` : ''}

Retorne em JSON:
- contractAnalysis: {type, pages, clauses, reviewedAt}
- findings: array de problemas encontrados {severity, clause, issue, suggestion}
- compliance: {lgpd, codigoCivil, codigoDefesaConsumidor}
- riskAssessment: avaliação de risco
- approvalRecommendation: aprovado|aprovado com ressalvas|requer revisão`,

    client_communication: (data) => `Redija uma comunicação para o cliente com:

Nome do cliente: ${data.clientName || 'Cliente'}
Processo: ${data.processNumber || '[Número do Processo]'}
Atualização: ${data.update || 'Nova movimentação processual'}
Ação necessária: ${data.action || 'Aguardar análise'}
Urgência: ${data.urgent ? 'ALTA' : 'Normal'}

Retorne em JSON:
- messageGenerated: boolean
- template: texto da mensagem
- tone: formal|informal|empático
- urgency: baixa|normal|alta
- channels: array de canais recomendados
- scheduledSend: immediate|agendado`,

    billing_analysis: (data) => `Analise o faturamento do período:

Período: ${data.period || 'Últimos 30 dias'}
${data.invoices ? `Faturas:\n${JSON.stringify(data.invoices, null, 2)}` : ''}

Retorne em JSON:
- periodAnalyzed: período
- totalBilled: valor total faturado
- totalReceived: valor total recebido
- pendingInvoices: número de faturas pendentes
- breakdown: {consultoria, processos, honorarios}
- insights: array de insights
- recommendations: array de recomendações
- projectedRevenue: receita projetada`,

    case_strategy: (data) => `Desenvolva uma estratégia para o caso:

Tipo: ${data.caseType || 'Processo Civil'}
Fase atual: ${data.phase || 'Instrução'}
${data.context ? `Contexto:\n${data.context}` : ''}

Retorne em JSON:
- strategyAnalysis: {caseType, currentPhase, estimatedDuration, complexity}
- recommendedActions: array de ações {priority, action, deadline, estimatedTime}
- successProbability: 0-1
- alternativeStrategies: array de estratégias alternativas
- precedentAnalysis: {favorablePrecedents, unfavorablePrecedents, recommendation}
- riskFactors: array de fatores de risco`,

    legal_translation: (data) => `Traduza/simplifique o seguinte texto jurídico:

Texto original: ${data.originalText || '[TEXTO PARA SIMPLIFICAR]'}
Nível de simplificação: ${data.level || 'intermediário'}

Retorne em JSON:
- translationCompleted: boolean
- sourceLanguage: jurídico técnico
- targetLanguage: linguagem simples
- originalLength: caracteres
- translatedLength: caracteres
- simplificationLevel: nível
- keyTermsGlossary: array de {term, translation}
- readabilityScore: 0-1
- suggestedImprovements: array de sugestões`,

    compliance_check: (data) => `Verifique compliance para:

Área: ${data.area || 'LGPD, Código de Ética OAB'}
${data.document ? `Documento:\n${data.document}` : ''}

Retorne em JSON:
- complianceStatus: conforme|não conforme
- checksPerformed: array de verificações {area, status, details, priority}
- violations: número de violações
- warnings: número de avisos
- recommendations: array de recomendações
- nextReview: data da próxima revisão (ISO date)
- certificationStatus: válido|requer renovação`,
  };

  const promptFn = taskDescriptions[task.type];
  return promptFn ? promptFn(task.data) : `Processe a seguinte tarefa:\n${JSON.stringify(task.data, null, 2)}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { task, agent } = req.body as { 
      task: AgentTask; 
      agent: { id: string; type: string; name: string } 
    };

    if (!task || !agent) {
      return res.status(400).json({ 
        error: 'Missing required fields: task and agent' 
      });
    }

    // Chamar Spark LLM
    const systemPrompt = getSystemPrompt(agent.type);
    const userPrompt = getUserPrompt(task);

    const sparkResponse = await fetch('/_spark/llm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!sparkResponse.ok) {
      throw new Error(`Spark LLM error: ${sparkResponse.statusText}`);
    }

    const sparkData = await sparkResponse.json() as { choices?: Array<{ message?: { content?: string } }>, usage?: { total_tokens?: number } };
    const aiContent = sparkData.choices?.[0]?.message?.content || '';

    // Tentar parsear como JSON
    let result: any;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { rawResponse: aiContent };
    } catch {
      result = { rawResponse: aiContent };
    }

    // Adicionar metadados
    result.processedAt = new Date().toISOString();
    result.agentId = agent.id;
    result.taskType = task.type;
    result.isRealAI = true;

    return res.status(200).json({
      ok: true,
      result,
      metadata: {
        tokensUsed: sparkData.usage?.total_tokens,
        processingTime: Date.now(),
      },
    });

  } catch (error) {
    console.error('[Process Task API] Error:', error);
    
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
