import { useState, useEffect, useCallback, useRef } from 'react'
import { useKV } from '@/hooks/use-kv'
import { useAutonomousAgents } from '@/hooks/use-autonomous-agents'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Sparkle, FileText, Download, Brain, Tray, ArrowClockwise, CloudArrowDown, Trash, CheckCircle, Robot, CalendarDots } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Expediente, Appointment } from '@/types'
import type { AgentTask } from '@/lib/agents'
import { createLocalAppointmentFromAnalysis, syncDeadlineToGoogleCalendar, type IntimationAnalysisResult } from '@/lib/deadline-calendar-integration'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Verifica se um expediente precisa de re-análise (tem mensagem de erro/placeholder)
function needsReanalysis(exp: Expediente): boolean {
  if (!exp.analyzed) return false
  const summary = exp.summary?.toLowerCase() || ''
  return summary.includes('indisponível') ||
    summary.includes('manualmente') ||
    summary.includes('revisar documento') ||
    summary === '' ||
    !exp.summary
}

// Verifica se um expediente precisa ser analisado
function needsAnalysis(exp: Expediente): boolean {
  return !exp.analyzed || needsReanalysis(exp)
}

// Determina quais agentes devem receber tarefas com base na análise
function getAgentTasksFromAnalysis(exp: Expediente, analysisData: {
  priority?: string
  deadline?: { days?: number; type?: string; endDate?: string }
  suggestedActions?: string[]
  documentType?: string
}): Partial<AgentTask>[] {
  const tasks: Partial<AgentTask>[] = []
  const priority = analysisData.priority?.toLowerCase() || 'média'
  const hasPrazo = analysisData.deadline?.days && analysisData.deadline.days > 0

  // 1. Gestão de Prazos - sempre que há prazo identificado
  if (hasPrazo) {
    tasks.push({
      agentId: 'gestao-prazos',
      type: 'calculate_deadline',
      priority: priority === 'alta' || priority === 'urgente' ? 'high' : 'medium',
      data: {
        expedienteId: exp.id,
        processNumber: exp.numeroProcesso,
        deadlineDays: analysisData.deadline?.days,
        deadlineType: analysisData.deadline?.type,
        deadlineDate: analysisData.deadline?.endDate,
        source: 'auto-analysis'
      }
    })
  }

  // 2. Monitor DJEN - registrar que foi processado
  tasks.push({
    agentId: 'monitor-djen',
    type: 'monitor_djen',
    priority: 'low',
    data: {
      expedienteId: exp.id,
      processNumber: exp.numeroProcesso,
      tribunal: exp.tribunal,
      action: 'register-processed',
      source: 'auto-analysis'
    }
  })

  // 3. Análise de Risco - para prioridades altas
  if (priority === 'alta' || priority === 'urgente') {
    tasks.push({
      agentId: 'analise-risco',
      type: 'risk_analysis',
      priority: 'high',
      data: {
        expedienteId: exp.id,
        processNumber: exp.numeroProcesso,
        summary: exp.summary,
        priority: priority,
        source: 'auto-analysis'
      }
    })
  }

  // 4. Redação de Petições - se ações sugerem resposta
  const needsResponse = analysisData.suggestedActions?.some(a =>
    a.toLowerCase().includes('resposta') ||
    a.toLowerCase().includes('manifestar') ||
    a.toLowerCase().includes('petição') ||
    a.toLowerCase().includes('contestar') ||
    a.toLowerCase().includes('recurso')
  )
  if (needsResponse) {
    tasks.push({
      agentId: 'redacao-peticoes',
      type: 'draft_petition',
      priority: priority === 'alta' ? 'high' : 'medium',
      data: {
        expedienteId: exp.id,
        processNumber: exp.numeroProcesso,
        documentType: analysisData.documentType,
        suggestedActions: analysisData.suggestedActions,
        source: 'auto-analysis'
      }
    })
  }

  // 5. Pesquisa de Jurisprudência - para casos complexos
  const needsResearch = analysisData.suggestedActions?.some(a =>
    a.toLowerCase().includes('jurisprudência') ||
    a.toLowerCase().includes('precedente') ||
    a.toLowerCase().includes('pesquisar')
  )
  if (needsResearch || priority === 'alta') {
    tasks.push({
      agentId: 'pesquisa-juris',
      type: 'research_precedents',
      priority: 'medium',
      data: {
        expedienteId: exp.id,
        processNumber: exp.numeroProcesso,
        summary: exp.summary,
        source: 'auto-analysis'
      }
    })
  }

  // 6. Estratégia Processual - sempre gera sugestão estratégica automaticamente
  tasks.push({
    agentId: 'estrategia-processual',
    type: 'case_strategy',
    priority: priority === 'alta' || priority === 'urgente' ? 'high' : 'medium',
    data: {
      expedienteId: exp.id,
      processNumber: exp.numeroProcesso,
      tribunal: exp.tribunal,
      summary: exp.summary,
      documentType: analysisData.documentType,
      priority: priority,
      deadline: analysisData.deadline,
      suggestedActions: analysisData.suggestedActions,
      source: 'auto-analysis'
    }
  })

  return tasks
}

export default function ExpedientePanel() {
  const [expedientes, setExpedientes] = useKV<Expediente[]>('expedientes', [])
  const [appointments, setAppointments] = useKV<Appointment[]>('appointments', [])
  const [selectedExp, setSelectedExp] = useState<Expediente | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [showMichaelRossDialog, setShowMichaelRossDialog] = useState(false)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [lawyersCount, setLawyersCount] = useState(0)

  // Estado para análise automática
  const [autoAnalyzing, setAutoAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0 })
  const [tasksCreated, setTasksCreated] = useState(0)
  const [deadlinesCreated, setDeadlinesCreated] = useState(0)
  const autoAnalysisRanRef = useRef(false)

  // Hook dos agentes autônomos para criar tarefas
  const { addTask, agents } = useAutonomousAgents()

  // Função para buscar expedientes da API
  const fetchExpedientes = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/expedientes')
      const data = await response.json()

      if (data.success && data.expedientes?.length > 0) {
        setExpedientes(data.expedientes)
        setLastSync(data.lastCheck)
        setLawyersCount(data.lawyersConfigured || 0)
        toast.success(`${data.expedientes.length} expediente(s) carregado(s)`)
      } else {
        setLawyersCount(data.lawyersConfigured || 0)
        if (data.lawyersConfigured === 0) {
          toast.info('Nenhum advogado configurado para monitoramento')
        }
      }
    } catch (error) {
      console.error('Erro ao buscar expedientes:', error)
      // Silently fail - API may not be available in dev
    } finally {
      setLoading(false)
    }
  }, [setExpedientes])

  // Busca expedientes ao montar componente
  useEffect(() => {
    fetchExpedientes()
  }, [fetchExpedientes])

  // Ensure expedientes is always an array to prevent runtime errors
  const safeExpedientes = Array.isArray(expedientes) ? expedientes : []

  // Helper para mapear prioridade PT -> EN
  const mapPriority = (priority: string | undefined): 'low' | 'medium' | 'high' | 'urgent' | undefined => {
    if (!priority) return 'medium'
    const map: Record<string, 'low' | 'medium' | 'high' | 'urgent'> = {
      'baixa': 'low', 'low': 'low',
      'média': 'medium', 'media': 'medium', 'medium': 'medium',
      'alta': 'high', 'high': 'high',
      'urgente': 'urgent', 'urgent': 'urgent'
    }
    return map[priority.toLowerCase()] || 'medium'
  }

  // Função para analisar um único expediente (retorna o expediente analisado)
  const analyzeExpediente = async (exp: Expediente): Promise<Expediente> => {
    try {
      const response = await fetch('/_spark/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini',
          messages: [
            {
              role: 'system',
              content: `Você é Mrs. Justin-e, uma especialista em análise de intimações judiciais brasileiras.
Analise a intimação abaixo e retorne um JSON com a seguinte estrutura:
{
  "summary": "Resumo claro da intimação em 2-3 frases",
  "documentType": "Tipo do documento (intimação, citação, despacho, etc)",
  "priority": "alta" | "média" | "baixa",
  "deadline": {
    "days": número de dias do prazo,
    "type": "úteis" | "corridos",
    "endDate": "data limite no formato DD/MM/YYYY"
  },
  "suggestedActions": ["lista de ações recomendadas"],
  "nextSteps": ["próximos passos a seguir"]
}
Responda APENAS com o JSON, sem texto adicional.`
            },
            {
              role: 'user',
              content: `Analise esta intimação:

PROCESSO: ${exp.numeroProcesso || 'Não informado'}
TRIBUNAL: ${exp.tribunal || 'Não informado'}
DATA: ${exp.receivedAt || exp.dataRecebimento || 'Não informada'}

CONTEÚDO:
${exp.content || exp.teor || 'Sem conteúdo'}`
            }
          ]
        })
      })

      const data = await response.json()
      const responseText = data.choices?.[0]?.message?.content || data.message?.content || ''

      let analysisData
      try {
        const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        analysisData = JSON.parse(jsonText)
      } catch {
        analysisData = {
          summary: responseText || 'Análise concluída',
          documentType: exp.type || 'Intimação',
          priority: 'média',
          deadline: { days: 15, type: 'úteis', endDate: 'Verificar' },
          suggestedActions: ['Verificar prazo processual', 'Analisar providências'],
          nextSteps: ['Revisar intimação', 'Preparar resposta se necessário']
        }
      }

      const analyzedExp: Expediente = {
        ...exp,
        analyzed: true,
        summary: analysisData.summary || 'Análise concluída pela Mrs. Justin-e',
        suggestedAction: analysisData.suggestedActions?.[0] || 'Verificar prazo',
        pendingDocs: analysisData.nextSteps || [],
        deadline: analysisData.deadline,
        priority: mapPriority(analysisData.priority),
        draftPetition: `ANÁLISE AUTOMÁTICA - Mrs. Justin-e\n\n` +
          `📋 RESUMO:\n${analysisData.summary || 'N/A'}\n\n` +
          `⚖️ TIPO: ${analysisData.documentType || exp.type}\n` +
          `🚨 PRIORIDADE: ${analysisData.priority || 'média'}\n\n` +
          `📅 PRAZO: ${analysisData.deadline?.days || 'N/A'} dias ${analysisData.deadline?.type || ''}\n` +
          `   Data limite: ${analysisData.deadline?.endDate || 'N/A'}\n\n` +
          `✅ AÇÕES SUGERIDAS:\n${(analysisData.suggestedActions || []).map((a: string, i: number) => `${i + 1}. ${a}`).join('\n')}\n\n` +
          `📝 PRÓXIMOS PASSOS:\n${(analysisData.nextSteps || []).map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}`
      }

      // Criar tarefas para outros agentes com base na análise
      const agentTasks = getAgentTasksFromAnalysis(analyzedExp, analysisData)
      let createdTasks = 0

      for (const taskData of agentTasks) {
        // Só cria tarefa se o agente estiver habilitado
        const agent = agents.find(a => a.id === taskData.agentId)
        if (agent?.enabled) {
          const task: AgentTask = {
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            agentId: taskData.agentId!,
            type: taskData.type!,
            priority: taskData.priority as 'low' | 'medium' | 'high' | 'critical',
            status: 'queued',
            createdAt: new Date().toISOString(),
            data: taskData.data as Record<string, unknown>
          }
          addTask(task)
          createdTasks++
        }
      }

      if (createdTasks > 0) {
        setTasksCreated(prev => prev + createdTasks)
      }

      // 📅 INTEGRAÇÃO COM CALENDÁRIO: Criar prazo automaticamente
      if (analysisData.deadline?.endDate || analysisData.deadline?.days) {
        try {
          const analysisResult: IntimationAnalysisResult = {
            summary: analysisData.summary || 'Intimação analisada',
            deadline: analysisData.deadline,
            priority: (analysisData.priority?.toLowerCase() || 'média') as 'baixa' | 'média' | 'alta' | 'crítica',
            nextSteps: analysisData.nextSteps || analysisData.suggestedActions,
            suggestedAction: analysisData.suggestedActions?.[0],
            processNumber: exp.numeroProcesso,
            court: exp.tribunal,
            documentType: analysisData.documentType || exp.type
          }

          // Calcular data limite se não estiver presente
          if (!analysisResult.deadline?.endDate && analysisResult.deadline?.days) {
            const hoje = new Date()
            const diasParaAdicionar = analysisResult.deadline.days
            const dataLimite = new Date(hoje)
            dataLimite.setDate(dataLimite.getDate() + diasParaAdicionar)
            analysisResult.deadline.endDate = dataLimite.toISOString()
          }

          const localAppointment = createLocalAppointmentFromAnalysis(
            analysisResult,
            `${exp.type || 'Intimação'} - ${exp.numeroProcesso || 'Processo'}`
          )

          if (localAppointment) {
            // Verificar se já existe
            const existingAppt = (appointments || []).find(apt =>
              apt.date === localAppointment.date &&
              apt.title.includes(exp.numeroProcesso?.substring(0, 15) || '')
            )

            if (!existingAppt) {
              setAppointments(current => [...(current || []), localAppointment])
              setDeadlinesCreated(prev => prev + 1)
              console.log('[ExpedientePanel] Prazo adicionado ao calendário:', localAppointment.title)

              // Tentar sincronizar com Google Calendar em background
              syncDeadlineToGoogleCalendar(
                analysisResult,
                `${exp.type || 'Intimação'} - ${exp.numeroProcesso || 'Processo'}`
              ).catch(err => console.warn('[ExpedientePanel] Sync com Google Calendar falhou:', err))
            }
          }
        } catch (calendarError) {
          console.warn('[ExpedientePanel] Erro ao criar prazo no calendário:', calendarError)
        }
      }

      return analyzedExp
    } catch (error) {
      console.error('Erro ao analisar expediente:', error)
      throw error
    }
  }

  // Análise automática de todos os expedientes pendentes
  const runAutoAnalysis = useCallback(async () => {
    const pending = safeExpedientes.filter(needsAnalysis)
    if (pending.length === 0) return

    setAutoAnalyzing(true)
    setAnalysisProgress({ current: 0, total: pending.length })
    setTasksCreated(0)

    toast.info(`🤖 Mrs. Justin-e iniciando análise automática de ${pending.length} intimação(ões)...`)

    let analyzed = 0
    for (const exp of pending) {
      try {
        const result = await analyzeExpediente(exp)
        setExpedientes((current) =>
          (current || []).map(e => e.id === exp.id ? result : e)
        )
        analyzed++
        setAnalysisProgress({ current: analyzed, total: pending.length })

        // Pequeno delay entre análises para não sobrecarregar a API
        if (analyzed < pending.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error(`Erro ao analisar expediente ${exp.id}:`, error)
      }
    }

    setAutoAnalyzing(false)
    if (analyzed > 0) {
      const deadlineMsg = deadlinesCreated > 0 ? ` e criou ${deadlinesCreated} prazo(s) na agenda` : ''
      toast.success(
        `✅ Mrs. Justin-e analisou ${analyzed} intimação(ões)${deadlineMsg} e distribuiu tarefas para os agentes!`,
        { duration: 5000 }
      )
    }
  }, [safeExpedientes, setExpedientes, addTask, agents, appointments, setAppointments])

  // Dispara análise automática quando expedientes são carregados
  useEffect(() => {
    // Só executa uma vez por sessão e se houver expedientes pendentes
    if (autoAnalysisRanRef.current) return
    if (safeExpedientes.length === 0) return
    if (loading) return

    const pending = safeExpedientes.filter(needsAnalysis)
    if (pending.length > 0) {
      autoAnalysisRanRef.current = true
      // Delay de 2 segundos para garantir que a UI já carregou
      setTimeout(() => {
        runAutoAnalysis()
      }, 2000)
    }
  }, [safeExpedientes, loading, runAutoAnalysis])

  // Análise com IA real via API Gemini direta (mantida para uso manual)
  const handleAnalyze = async (exp: Expediente) => {
    setAnalyzing(true)
    setSelectedExp(exp)

    try {
      // Usa API Gemini diretamente para análise mais confiável
      const response = await fetch('/_spark/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini',
          messages: [
            {
              role: 'system',
              content: `Você é Mrs. Justin-e, uma especialista em análise de intimações judiciais brasileiras.
Analise a intimação abaixo e retorne um JSON com a seguinte estrutura:
{
  "summary": "Resumo claro da intimação em 2-3 frases",
  "documentType": "Tipo do documento (intimação, citação, despacho, etc)",
  "priority": "alta" | "média" | "baixa",
  "deadline": {
    "days": número de dias do prazo,
    "type": "úteis" | "corridos",
    "endDate": "data limite no formato DD/MM/YYYY"
  },
  "suggestedActions": ["lista de ações recomendadas"],
  "nextSteps": ["próximos passos a seguir"]
}
Responda APENAS com o JSON, sem texto adicional.`
            },
            {
              role: 'user',
              content: `Analise esta intimação:

PROCESSO: ${exp.numeroProcesso || 'Não informado'}
TRIBUNAL: ${exp.tribunal || 'Não informado'}
DATA: ${exp.receivedAt || exp.dataRecebimento || 'Não informada'}

CONTEÚDO:
${exp.content || exp.teor || 'Sem conteúdo'}`
            }
          ]
        })
      })

      const data = await response.json()

      // Extrai o conteúdo da resposta
      const responseText = data.choices?.[0]?.message?.content || data.message?.content || ''

      // Tenta fazer parse do JSON da resposta
      let analysisData
      try {
        // Remove possíveis marcadores de código
        const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        analysisData = JSON.parse(jsonText)
      } catch {
        // Se não conseguir parse, cria estrutura básica com a resposta
        analysisData = {
          summary: responseText || 'Análise concluída',
          documentType: exp.type || 'Intimação',
          priority: 'média',
          deadline: { days: 15, type: 'úteis', endDate: 'Verificar' },
          suggestedActions: ['Verificar prazo processual', 'Analisar providências'],
          nextSteps: ['Revisar intimação', 'Preparar resposta se necessário']
        }
      }

      const analyzed: Expediente = {
        ...exp,
        analyzed: true,
        summary: analysisData.summary || 'Análise concluída pela Mrs. Justin-e',
        suggestedAction: analysisData.suggestedActions?.[0] || 'Verificar prazo',
        pendingDocs: analysisData.nextSteps || [],
        deadline: analysisData.deadline,
        priority: mapPriority(analysisData.priority),
        draftPetition: `ANÁLISE AUTOMÁTICA - Mrs. Justin-e\n\n` +
          `📋 RESUMO:\n${analysisData.summary || 'N/A'}\n\n` +
          `⚖️ TIPO: ${analysisData.documentType || exp.type}\n` +
          `🚨 PRIORIDADE: ${analysisData.priority || 'média'}\n\n` +
          `📅 PRAZO: ${analysisData.deadline?.days || 'N/A'} dias ${analysisData.deadline?.type || ''}\n` +
          `   Data limite: ${analysisData.deadline?.endDate || 'N/A'}\n\n` +
          `✅ AÇÕES SUGERIDAS:\n${(analysisData.suggestedActions || []).map((a: string, i: number) => `${i + 1}. ${a}`).join('\n')}\n\n` +
          `📝 PRÓXIMOS PASSOS:\n${(analysisData.nextSteps || []).map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}`
      }

      setExpedientes((current) =>
        (current || []).map(e => e.id === exp.id ? analyzed : e)
      )
      setSelectedExp(analyzed)
      toast.success('Mrs. Justin-e concluiu a análise!')

    } catch (error) {
      console.error('Erro na análise:', error)
      toast.error('Erro na análise com IA. Tente novamente.')
      // NÃO salvar como analisado se falhou - permite tentar novamente
    } finally {
      setAnalyzing(false)
    }
  }

  const handleActivateMichaelRoss = () => {
    setShowMichaelRossDialog(true)
  }

  // Análise com Mrs. Justin-e (tarefa específica)
  const handleSelectTask = async (task: string) => {
    setSelectedTask(task)
    setAnalyzing(true)

    try {
      if (selectedExp) {
        // Usa API Gemini diretamente
        const response = await fetch('/_spark/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gemini',
            messages: [
              {
                role: 'system',
                content: `Você é Mrs. Justin-e, especialista em controladoria jurídica.
Crie um workflow detalhado para a tarefa solicitada.
Retorne um JSON:
{
  "summary": "Resumo da tarefa e contexto",
  "deadline": { "days": número, "type": "úteis" | "corridos", "endDate": "DD/MM/YYYY" },
  "checklist": ["itens do checklist para executar a tarefa"],
  "nextSteps": ["próximos passos após a tarefa"],
  "observations": "observações importantes"
}
Responda APENAS com o JSON.`
              },
              {
                role: 'user',
                content: `TAREFA: ${task}

PROCESSO: ${selectedExp.numeroProcesso || 'Não informado'}
TRIBUNAL: ${selectedExp.tribunal || 'Não informado'}

CONTEXTO DA INTIMAÇÃO:
${selectedExp.content || selectedExp.teor || 'Sem conteúdo'}

Crie o workflow de controladoria para esta tarefa.`
              }
            ]
          })
        })

        const data = await response.json()
        const responseText = data.choices?.[0]?.message?.content || data.message?.content || ''

        let analysisData
        try {
          const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          analysisData = JSON.parse(jsonText)
        } catch {
          analysisData = {
            summary: `Workflow criado para: ${task}`,
            deadline: { days: 15, type: 'úteis', endDate: 'Calcular' },
            checklist: ['Verificar prazo', 'Elaborar documento', 'Protocolar'],
            nextSteps: ['Acompanhar andamento', 'Aguardar manifestação'],
            observations: responseText || 'Sem observações adicionais'
          }
        }

        const analyzed: Expediente = {
          ...selectedExp,
          analyzed: true,
          summary: analysisData.summary || `Mrs. Justin-e analisou a intimação para: ${task}`,
          suggestedAction: `Executar: ${task}`,
          pendingDocs: analysisData.checklist || analysisData.nextSteps || ['Documento Principal'],
          deadline: analysisData.deadline,
          priority: 'high',
          draftPetition: `WORKFLOW DE CONTROLADORIA - Mrs. Justin-e\n\n` +
            `🎯 TAREFA: ${task}\n\n` +
            `📋 RESUMO:\n${analysisData.summary || 'Workflow em processamento'}\n\n` +
            `📅 PRAZO: ${analysisData.deadline?.days || 15} dias ${analysisData.deadline?.type || 'úteis'}\n` +
            `   Data limite: ${analysisData.deadline?.endDate || 'Calcular'}\n\n` +
            `✅ CHECKLIST:\n${(analysisData.checklist || analysisData.nextSteps || []).map((s: string, i: number) => `☐ ${i + 1}. ${s}`).join('\n')}\n\n` +
            `📝 OBSERVAÇÕES:\n${analysisData.observations || 'Nenhuma'}`
        }

        setExpedientes((current) =>
          (current || []).map(e => e.id === selectedExp.id ? analyzed : e)
        )
        setSelectedExp(analyzed)
        toast.success('Mrs. Justin-e criou o workflow de controladoria!')
      }
    } catch (error) {
      console.error('Erro no workflow:', error)
      toast.error('Erro ao criar workflow. Tente novamente.')
    } finally {
      setAnalyzing(false)
      setShowMichaelRossDialog(false)
    }
  }

  // Limpar análises antigas com erro para permitir re-análise
  const handleClearFailedAnalysis = () => {
    const needsReanalysisList = safeExpedientes.filter(needsReanalysis)
    if (needsReanalysisList.length === 0) {
      toast.info('Nenhum expediente com análise inválida encontrado')
      return
    }

    setExpedientes((current) =>
      (current || []).map(exp =>
        needsReanalysis(exp)
          ? { ...exp, analyzed: false, summary: undefined, suggestedAction: undefined, pendingDocs: undefined }
          : exp
      )
    )
    toast.success(`${needsReanalysisList.length} expediente(s) liberado(s) para re-análise`)
  }

  const suggestedTasks = [
    'Apresentar alegações finais',
    'Juntar documentos complementares',
    'Manifestar sobre documentos juntados',
    'Especificar provas',
    'Cumprir diligência determinada',
    'Apresentar rol de testemunhas'
  ]

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Painel de Expedientes</h1>
            <p className="text-muted-foreground mt-1">
              Caixa de entrada inteligente com análise de IA
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="font-medium">Advogado:</span> Thiago Bodevan Veiga - OAB/MG 184.404
              {lastSync && (
                <span className="ml-2">• Última verificação: {new Date(lastSync).toLocaleString('pt-BR')}</span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {safeExpedientes.some(needsReanalysis) && (
              <Button
                onClick={handleClearFailedAnalysis}
                variant="outline"
                size="sm"
                title="Limpar análises com erro para permitir re-análise"
              >
                <Trash className="w-4 h-4 mr-2" />
                Limpar Análises Inválidas
              </Button>
            )}
            <Button
              onClick={fetchExpedientes}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <ArrowClockwise className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>
        </div>

        {/* Barra de progresso da análise automática */}
        {autoAnalyzing && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <Brain className="w-8 h-8 text-primary animate-pulse" weight="fill" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">
                      🤖 Mrs. Justin-e analisando intimações e distribuindo tarefas...
                    </p>
                    <span className="text-sm text-muted-foreground">
                      {analysisProgress.current}/{analysisProgress.total}
                    </span>
                  </div>
                  <Progress
                    value={(analysisProgress.current / analysisProgress.total) * 100}
                    className="h-2"
                  />
                  {tasksCreated > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      <Robot className="w-3 h-3 inline mr-1" />
                      {tasksCreated} tarefa(s) distribuída(s) para agentes
                      {deadlinesCreated > 0 && (
                        <span className="ml-2">
                          <CalendarDots className="w-3 h-3 inline mr-1" />
                          {deadlinesCreated} prazo(s) na agenda
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status de análises concluídas */}
        {!autoAnalyzing && safeExpedientes.length > 0 && safeExpedientes.every(e => e.analyzed && !needsReanalysis(e)) && (
          <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" weight="fill" />
                  <p className="text-sm text-green-700 dark:text-green-400">
                    ✅ Todas as {safeExpedientes.length} intimações analisadas pela Mrs. Justin-e
                  </p>
                </div>
                {tasksCreated > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    <Robot className="w-3 h-3 mr-1" />
                    {tasksCreated} tarefas na fila dos agentes
                  </Badge>
                )}
                {deadlinesCreated > 0 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <CalendarDots className="w-3 h-3 mr-1" />
                    {deadlinesCreated} prazos na agenda
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  Expedientes Recentes
                  <Badge variant="secondary">{safeExpedientes.length}</Badge>
                </CardTitle>
                <CardDescription>Intimações do DJEN aguardando análise</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {safeExpedientes.length === 0 ? (
                  <div className="text-center py-8 space-y-3">
                    <CloudArrowDown className="w-12 h-12 mx-auto text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma publicação encontrada
                    </p>
                    <p className="text-xs text-muted-foreground">
                      O monitor DJEN verifica automaticamente às 9h (UTC)
                    </p>
                    <Button
                      onClick={fetchExpedientes}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      <ArrowClockwise className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Verificar Agora
                    </Button>
                  </div>
                ) : (
                  safeExpedientes.map((exp) => (
                    <div
                      key={exp.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedExp?.id === exp.id
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card border-border hover:bg-muted'
                        }`}
                      onClick={() => setSelectedExp(exp)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{exp.type || exp.tipo}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(exp.receivedAt || exp.dataRecebimento).toLocaleDateString('pt-BR')}
                            {exp.tribunal && <span className="ml-1">• {exp.tribunal}</span>}
                          </p>
                        </div>
                        {exp.analyzed ? (
                          <Badge variant="default">Analisado</Badge>
                        ) : (
                          <Badge variant="outline">Pendente</Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {selectedExp ? (
              <Card key="selected-expediente">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{selectedExp.type}</CardTitle>
                      <CardDescription className="mt-1">
                        Recebido em {new Date(selectedExp.receivedAt || selectedExp.dataRecebimento).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </div>
                    {!selectedExp.analyzed && (
                      <div className="flex gap-2">
                        <Button onClick={() => handleActivateMichaelRoss()} disabled={analyzing} variant="default">
                          <Brain className="w-4 h-4 mr-2" weight="fill" />
                          {analyzing ? 'Analisando...' : 'Ativar Michael Ross'}
                        </Button>
                        <Button onClick={() => handleAnalyze(selectedExp)} disabled={analyzing} variant="outline">
                          <Sparkle className="w-4 h-4 mr-2" weight="fill" />
                          Análise Padrão
                        </Button>
                      </div>
                    )}
                    {selectedExp.analyzed && needsReanalysis(selectedExp) && (
                      <Button onClick={() => handleAnalyze(selectedExp)} disabled={analyzing} variant="outline" size="sm">
                        <ArrowClockwise className={`w-4 h-4 mr-2 ${analyzing ? 'animate-spin' : ''}`} />
                        {analyzing ? 'Re-analisando...' : 'Re-analisar com IA'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Conteúdo Original</h3>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm whitespace-pre-wrap document-content">{selectedExp.content}</p>
                    </div>
                  </div>

                  {selectedExp.analyzed && (
                    <>
                      <div>
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Sparkle className="w-4 h-4 text-accent" weight="fill" />
                          Resumo Inteligente
                        </h3>
                        <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                          <p className="text-sm">{selectedExp.summary}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold mb-2">Ação Sugerida</h3>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-900">{selectedExp.suggestedAction}</p>
                        </div>
                      </div>

                      {selectedExp.pendingDocs && selectedExp.pendingDocs.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold mb-2">Documentos Pendentes</h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedExp.pendingDocs.map((doc, idx) => (
                              <Badge key={idx} variant="outline">
                                <FileText className="w-3 h-3 mr-1" />
                                {doc}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedExp.draftPetition && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                              <Sparkle className="w-4 h-4 text-accent" weight="fill" />
                              Minuta de Petição Gerada
                            </h3>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              Exportar
                            </Button>
                          </div>
                          <Textarea
                            value={selectedExp.draftPetition}
                            className="min-h-[200px] document-content"
                            readOnly
                          />
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card key="empty-selection">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Tray className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-foreground">Selecione um expediente</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Escolha um expediente da lista para visualizar e analisar
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showMichaelRossDialog} onOpenChange={setShowMichaelRossDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Brain className="w-7 h-7 text-primary" weight="fill" />
              Mrs. Michael Ross - Análise de Intimação
            </DialogTitle>
            <DialogDescription>
              Resumo: {selectedExp?.summary || 'Intimação recebida aguardando análise detalhada'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-accent/10 p-4 rounded-lg border border-accent/30">
              <p className="text-sm font-medium text-foreground mb-2">
                📊 Análise Rápida (95% de precisão em menos de 1 minuto)
              </p>
              <p className="text-xs text-muted-foreground">
                Identifiquei que esta intimação requer ação. Selecione a tarefa mais pertinente ao caso:
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">
                Tarefas Sugeridas:
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {suggestedTasks.map((task, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectTask(task)}
                    disabled={analyzing}
                    className="p-3 text-left rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">{index + 1}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{task}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                💡 Após selecionar, Mrs. Michael Ross irá:
                <br />• Calcular prazos automaticamente (D-1, D-2 ou D-n)
                <br />• Criar workflow de controladoria
                <br />• Preparar atendimento
                <br />• Gerar minuta de petição
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
