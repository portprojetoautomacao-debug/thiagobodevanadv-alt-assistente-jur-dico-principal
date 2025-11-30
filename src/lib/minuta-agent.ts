// minuta-agent.ts
// Agente de IA que:
// 1) Gera minuta com Gemini
// 2) Salva no Google Docs
// 3) Cria prazo automático no Google Calendar (opcional)

import type { Minuta } from '@/types'
import { googleDocsService } from './google-docs-service'
import { googleCalendarService, type DeadlineEvent } from './google-calendar-service'
import { generatePeticao } from '@/lib/gemini-service'

// Mesmo shape do módulo de integração de prazos (deadline-integration)
export interface MinutaAgentDeadline {
  endDate: string              // ISO ou YYYY-MM-DD
  days: number
  type: 'úteis' | 'corridos'
  priority?: 'baixa' | 'média' | 'alta' | 'crítica'
  description?: string
}

export interface MinutaAgentParams {
  tipoMinuta: string                 // ex: "Petição Inicial", "Contestação", "Recurso de Apelação"
  detalhesCaso: string               // fatos, contexto, decisão, etc.
  titulo?: string                    // se não vier, o agent monta
  numeroProcesso?: string
  tribunal?: string
  prazo?: MinutaAgentDeadline | null // se vier, cria evento de prazo no Calendar
  sync?: {
    docs?: boolean                   // default: true
    calendar?: boolean               // default: true (se prazo existir)
  }
}

export interface MinutaAgentResult {
  success: boolean
  provider: 'gemini-2.5-pro'
  minuta: Minuta | null

  // Google Docs
  docsId?: string | null
  docsUrl?: string | null

  // Google Calendar
  calendarEventId?: string | null

  // Informações de prazo (eco do input + normalização)
  prazo?: MinutaAgentDeadline | null

  // Logs/erros para UI
  errors: string[]
}

/**
 * Normaliza data de prazo para ISO YYYY-MM-DD (sem horário)
 */
function normalizeDateToISO(dateStr: string): string {
  // Se já estiver no formato YYYY-MM-DD, mantemos
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr
  }

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    throw new Error(`Data de prazo inválida: ${dateStr}`)
  }
  return date.toISOString().split('T')[0]
}

/**
 * Converte prioridade textual para enum usado pelo GoogleCalendarService
 */
function mapPriority(
  priority?: MinutaAgentDeadline['priority']
): 'baixa' | 'media' | 'alta' | 'critica' | undefined {
  if (!priority) return undefined
  switch (priority) {
    case 'baixa':
      return 'baixa'
    case 'média':
      return 'media'
    case 'alta':
      return 'alta'
    case 'crítica':
      return 'critica'
    default:
      return undefined
  }
}

/**
 * Função de feedback visual para o usuário durante o processo
 */
function giveUserFeedback(message: string, isError: boolean = false) {
  // Aqui você pode substituir esse log por um sistema real de feedback para o usuário
  if (isError) {
    console.error(`[Erro]: ${message}`)
  } else {
    console.log(`[Sucesso]: ${message}`)
  }
}

/**
 * Agente principal:
 * - Gera minuta com Gemini
 * - Opcionalmente salva no Google Docs
 * - Opcionalmente cria prazo no Google Calendar
 */
export async function criarMinutaComAgenteIA(
  params: MinutaAgentParams
): Promise<MinutaAgentResult> {
  const errors: string[] = []
  const {
    tipoMinuta,
    detalhesCaso,
    titulo,
    numeroProcesso,
    tribunal,
    prazo,
    sync,
  } = params

  const syncDocs = sync?.docs ?? true
  const syncCalendar = sync?.calendar ?? true

  try {
    // 1) Gera a minuta usando Gemini (HTML/Texto da peça)
    const geminiResponse = await generatePeticao(tipoMinuta, detalhesCaso)

    if (geminiResponse.error || !geminiResponse.text) {
      const msg = geminiResponse.error || 'Gemini retornou texto vazio na geração da minuta'
      errors.push(msg)
      giveUserFeedback(msg, true)
      return {
        success: false,
        provider: 'gemini-2.5-pro',
        minuta: null,
        docsId: null,
        docsUrl: null,
        calendarEventId: null,
        prazo: prazo ?? null,
        errors,
      }
    }

    const conteudoGerado = geminiResponse.text

    // 2) Monta objeto Minuta (mínimo necessário: id, titulo, conteudo)
    const tituloMinuta =
      titulo ||
      `Minuta - ${tipoMinuta}${numeroProcesso ? ` - Proc. ${numeroProcesso}` : ''
      }`

    const minuta: Minuta = {
      // compatível com o tipo do seu app (id/titulo/conteudo são seguros)
      id: crypto.randomUUID(),
      titulo: tituloMinuta,
      conteudo: conteudoGerado,
      // campos extras do seu tipo Minuta (se existirem) ficam opcionais
      // e podem ser preenchidos pelo restante do app
    } as Minuta

    let docsId: string | null = null
    let docsUrl: string | null = null
    let calendarEventId: string | null = null

    // 3) Salvar no Google Docs (se habilitado)
    if (syncDocs) {
      try {
        const docsResult = await googleDocsService.createDocument(minuta)
        if (docsResult && docsResult.docId) {
          docsId = docsResult.docId
          docsUrl = docsResult.url
        } else {
          errors.push('Não foi possível criar o documento no Google Docs')
          giveUserFeedback('Erro ao salvar no Google Docs', true)
        }
      } catch (err) {
        console.error('[MinutaAgent] Erro ao criar documento no Google Docs:', err)
        errors.push(
          err instanceof Error
            ? `Erro ao criar documento no Google Docs: ${err.message}`
            : 'Erro desconhecido ao criar documento no Google Docs'
        )
        giveUserFeedback('Erro ao salvar no Google Docs', true)
      }
    }

    // 4) Criar prazo no Google Calendar (se houver info de prazo + sync ativo)
    let prazoNormalizado: MinutaAgentDeadline | null = prazo ?? null

    if (prazo && syncCalendar) {
      try {
        const isoDate = normalizeDateToISO(prazo.endDate)

        prazoNormalizado = {
          ...prazo,
          endDate: isoDate,
        }

        const deadlineEvent: DeadlineEvent = {
          title: tituloMinuta,
          description: [
            `Minuta: ${tipoMinuta}`,
            numeroProcesso ? `Processo: ${numeroProcesso}` : '',
            tribunal ? `Tribunal: ${tribunal}` : '',
            prazo.description ? `Detalhes do prazo: ${prazo.description}` : '',
          ]
            .filter(Boolean)
            .join('\n'),
          deadline: isoDate,
          processNumber: numeroProcesso,
          type: 'prazo',
          priority: mapPriority(prazo.priority),
          reminders: prazo.priority === 'crítica'
            ? [60, 240, 1440, 2880, 4320] // mais agressivo pra crítica
            : prazo.priority === 'alta'
              ? [60, 1440, 2880]
              : prazo.priority === 'média'
                ? [60, 1440]
                : [60],
        }

        const eventId = await googleCalendarService.createDeadlineEvent(deadlineEvent)

        if (eventId) {
          calendarEventId = eventId
        } else {
          errors.push('Não foi possível criar o evento de prazo no Google Calendar')
          giveUserFeedback('Erro ao criar evento no Google Calendar', true)
        }
      } catch (err) {
        console.error('[MinutaAgent] Erro ao criar evento de prazo no Calendar:', err)
        errors.push(
          err instanceof Error
            ? `Erro ao criar evento no Google Calendar: ${err.message}`
            : 'Erro desconhecido ao criar evento no Google Calendar'
        )
        giveUserFeedback('Erro ao criar evento no Google Calendar', true)
      }
    }

    giveUserFeedback('Minuta gerada com sucesso', false)

    return {
      success: errors.length === 0,
      provider: 'gemini-2.5-pro',
      minuta,
      docsId,
      docsUrl,
      calendarEventId,
      prazo: prazoNormalizado,
      errors,
    }
  } catch (error) {
    console.error('[MinutaAgent] Falha inesperada no fluxo do agente de minuta:', error)
    errors.push(
      error instanceof Error
        ? `Falha inesperada: ${error.message}`
        : 'Falha inesperada ao executar o agente de minuta'
    )
    giveUserFeedback('Erro inesperado na execução', true)

    return {
      success: false,
      provider: 'gemini-2.5-pro',
      minuta: null,
      docsId: null,
      docsUrl: null,
      calendarEventId: null,
      prazo: prazo ?? null,
      errors,
    }
  }
}
