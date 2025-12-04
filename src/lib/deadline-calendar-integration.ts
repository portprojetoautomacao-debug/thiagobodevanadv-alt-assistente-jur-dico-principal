/**
 * Integração entre Agente de Gestão de Prazos e Calendário
 *
 * Este módulo conecta os resultados da análise de intimações
 * ao calendário local e Google Calendar.
 */

import type { Appointment } from "@/types";
import { googleCalendarService, type DeadlineEvent } from "./google-calendar-service";

// Tipos para integração
export interface AnalysisDeadline {
  days: number;
  type: "úteis" | "corridos";
  endDate: string;
  description?: string;
}

export interface IntimationAnalysisResult {
  summary: string;
  deadline?: AnalysisDeadline;
  priority: "baixa" | "média" | "alta" | "crítica";
  nextSteps?: string[];
  suggestedAction?: string;
  processNumber?: string;
  court?: string;
  documentType?: string;
}

export interface DeadlineCreationResult {
  success: boolean;
  localAppointmentId?: string;
  googleEventId?: string;
  error?: string;
}

/**
 * Normaliza prioridade para o formato usado pelo Google Calendar service
 * ('média' → 'media', 'crítica' → 'critica')
 */
function normalizePriorityForCalendar(
  priority: IntimationAnalysisResult["priority"]
): "baixa" | "media" | "alta" | "critica" {
  switch (priority) {
    case "média":
      return "media";
    case "crítica":
      return "critica";
    case "alta":
      return "alta";
    case "baixa":
    default:
      return "baixa";
  }
}

/**
 * Valida componentes numéricos de uma data no formato DD/MM/YYYY
 */
function validateDateComponents(day: number, month: number, year: number): boolean {
  return (
    !Number.isNaN(day) &&
    !Number.isNaN(month) &&
    !Number.isNaN(year) &&
    day >= 1 &&
    day <= 31 &&
    month >= 1 &&
    month <= 12 &&
    year >= 2000
  );
}

/**
 * Parseia data no formato brasileiro DD/MM/YYYY para Date
 * Retorna null se formato inválido
 */
function parseBrazilianDate(dateStr: string): Date | null {
  const parts = dateStr.split("/").map((p) => p.trim());
  if (parts.length !== 3) {
    return null;
  }

  const [day, month, year] = parts;
  const dayNum = Number.parseInt(day, 10);
  const monthNum = Number.parseInt(month, 10);
  const yearNum = Number.parseInt(year, 10);

  if (!validateDateComponents(dayNum, monthNum, yearNum)) {
    return null;
  }

  // Criar data em UTC para evitar problemas de timezone
  return new Date(Date.UTC(yearNum, monthNum - 1, dayNum, 12, 0, 0));
}

/**
 * Converte string de data para objeto Date
 * Suporta formato brasileiro (DD/MM/YYYY) e ISO
 */
function parseDeadlineDate(endDate: string): Date | null {
  if (endDate.includes("/")) {
    return parseBrazilianDate(endDate);
  }

  const date = new Date(endDate);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Constrói descrição rica para compromisso de prazo
 */
function buildAppointmentDescription(analysis: IntimationAnalysisResult): string {
  const descriptionParts = [
    analysis.summary,
    "",
    `📅 Prazo: ${analysis.deadline?.days} dias ${analysis.deadline?.type}`,
    analysis.processNumber ? `📋 Processo: ${analysis.processNumber}` : "",
    analysis.court ? `🏛️ Tribunal: ${analysis.court}` : "",
    analysis.documentType ? `📄 Tipo: ${analysis.documentType}` : "",
    "",
    "📌 Próximos Passos:",
    ...(analysis.nextSteps || []).map((step, i) => `${i + 1}. ${step}`),
    "",
    analysis.suggestedAction ? `⚡ Ação Recomendada: ${analysis.suggestedAction}` : "",
  ].filter(Boolean);

  return descriptionParts.join("\n");
}

/**
 * Constrói o título do compromisso
 */
function buildAppointmentTitle(intimationTitle: string): string {
  const truncatedTitle =
    intimationTitle.length > 50 ? `${intimationTitle.substring(0, 50)}...` : intimationTitle;
  return `⚠️ PRAZO: ${truncatedTitle}`;
}

/**
 * Criar compromisso local a partir de análise de intimação
 */
export function createLocalAppointmentFromAnalysis(
  analysis: IntimationAnalysisResult,
  intimationTitle: string
): Appointment | null {
  if (!analysis.deadline?.endDate) {
    console.log("[DeadlineIntegration] No deadline found in analysis");
    return null;
  }

  const deadlineDate = parseDeadlineDate(analysis.deadline.endDate);
  if (!deadlineDate) {
    console.warn("[DeadlineIntegration] Invalid deadline date:", analysis.deadline.endDate);
    return null;
  }

  const appointment = buildAppointment(analysis, intimationTitle, deadlineDate);

  console.log("[DeadlineIntegration] Created local appointment:", {
    id: appointment.id,
    title: appointment.title,
    date: appointment.date,
    priority: analysis.priority,
  });

  return appointment;
}

function buildAppointment(
  analysis: IntimationAnalysisResult,
  intimationTitle: string,
  deadlineDate: Date
): Appointment {
  const dateStr = deadlineDate.toISOString().split("T")[0];
  const type: Appointment["type"] =
    analysis.priority === "crítica" || analysis.priority === "alta" ? "prazo" : "outro";

  return {
    id: crypto.randomUUID(),
    title: buildAppointmentTitle(intimationTitle),
    description: buildAppointmentDescription(analysis),
    type,
    date: dateStr,
    time: "09:00", // Padrão: manhã
    duration: 60,
    location: analysis.court || "",
    reminders: getPriorityReminders(analysis.priority),
  };
}

/**
 * Obter lembretes baseados na prioridade
 * (valores em minutos antes do evento)
 */
function getPriorityReminders(priority: IntimationAnalysisResult["priority"]): number[] {
  switch (priority) {
    case "crítica":
      // 1 hora, 4 horas, 1 dia, 2 dias, 3 dias antes
      return [60, 240, 1440, 2880, 4320];
    case "alta":
      // 1 hora, 1 dia, 2 dias antes
      return [60, 1440, 2880];
    case "média":
      // 1 hora, 1 dia antes
      return [60, 1440];
    case "baixa":
    default:
      // 1 hora antes
      return [60];
  }
}

/**
 * Sincronizar prazo com Google Calendar (se conectado)
 */
export async function syncDeadlineToGoogleCalendar(
  analysis: IntimationAnalysisResult,
  intimationTitle: string
): Promise<string | null> {
  if (!analysis.deadline?.endDate) {
    return null;
  }

  // Verificar se Google Calendar está configurado e conectado
  const status = googleCalendarService.getStatus();

  if (!status.configured) {
    console.log("[DeadlineIntegration] Google Calendar not configured");
    return null;
  }

  if (!status.authenticated) {
    console.log("[DeadlineIntegration] Google Calendar not authenticated");
    return null;
  }

  try {
    const deadlineEvent: DeadlineEvent = {
      title: intimationTitle.substring(0, 100),
      description: [
        analysis.summary,
        "",
        analysis.processNumber ? `Processo: ${analysis.processNumber}` : "",
        analysis.court ? `Tribunal: ${analysis.court}` : "",
        "",
        "Próximos Passos:",
        ...(analysis.nextSteps || []).map((step, i) => `${i + 1}. ${step}`),
      ]
        .filter(Boolean)
        .join("\n"),
      deadline: analysis.deadline.endDate,
      processNumber: analysis.processNumber,
      type: "prazo",
      priority: normalizePriorityForCalendar(analysis.priority),
      reminders: getPriorityReminders(analysis.priority),
    };

    const eventId = await googleCalendarService.createDeadlineEvent(deadlineEvent);

    if (eventId) {
      console.log("[DeadlineIntegration] Created Google Calendar event:", eventId);
    }

    return eventId;
  } catch (error) {
    console.error("[DeadlineIntegration] Failed to sync to Google Calendar:", error);
    return null;
  }
}

/**
 * Criar prazo completo (local + Google Calendar)
 */
export async function createDeadlineFromAnalysis(
  analysis: IntimationAnalysisResult,
  intimationTitle: string,
  currentAppointments: Appointment[],
  setAppointments: (updater: (current: Appointment[]) => Appointment[]) => void,
  syncToGoogle: boolean = true
): Promise<DeadlineCreationResult> {
  const result: DeadlineCreationResult = {
    success: false,
  };

  try {
    // 1. Criar compromisso local
    const localAppointment = createLocalAppointmentFromAnalysis(analysis, intimationTitle);

    if (!localAppointment) {
      result.error = "Nenhum prazo encontrado na análise";
      return result;
    }

    // Verificar se já existe um compromisso similar
    const existingAppointment = currentAppointments.find(
      (apt) =>
        apt.date === localAppointment.date && apt.title.includes(intimationTitle.substring(0, 30))
    );

    if (existingAppointment) {
      console.log("[DeadlineIntegration] Appointment already exists:", existingAppointment.id);
      result.success = true;
      result.localAppointmentId = existingAppointment.id;
      return result;
    }

    // Adicionar ao calendário local
    setAppointments((current) => [...(current || []), localAppointment]);
    result.localAppointmentId = localAppointment.id;
    result.success = true;

    console.log("[DeadlineIntegration] Added local appointment:", localAppointment.id);

    // 2. Sincronizar com Google Calendar se habilitado
    if (syncToGoogle) {
      const googleEventId = await syncDeadlineToGoogleCalendar(analysis, intimationTitle);
      if (googleEventId) {
        result.googleEventId = googleEventId;
      }
    }

    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[DeadlineIntegration] Error creating deadline:", error);
    return result;
  }
}

/**
 * Processar múltiplas análises e criar prazos em lote
 */
export async function batchCreateDeadlines(
  analyses: Array<{ analysis: IntimationAnalysisResult; title: string }>,
  currentAppointments: Appointment[],
  setAppointments: (updater: (current: Appointment[]) => Appointment[]) => void,
  syncToGoogle: boolean = true
): Promise<{
  total: number;
  created: number;
  skipped: number;
  errors: number;
  details: DeadlineCreationResult[];
}> {
  const results: DeadlineCreationResult[] = [];

  // Filtrar apenas análises com prazos
  const analysesWithDeadlines = analyses.filter((a) => a.analysis.deadline?.endDate);

  console.log(
    `[DeadlineIntegration] Processing ${analysesWithDeadlines.length} deadlines from ${analyses.length} analyses`
  );

  // Coletar todos os novos appointments primeiro
  const newAppointments: Appointment[] = [];

  for (const { analysis, title } of analysesWithDeadlines) {
    const localAppointment = createLocalAppointmentFromAnalysis(analysis, title);

    if (!localAppointment) {
      results.push({ success: false, error: "Sem prazo" });
      continue;
    }

    // Verificar duplicata (nos existentes e nos novos)
    const isDuplicate = [...currentAppointments, ...newAppointments].some(
      (apt) => apt.date === localAppointment.date && apt.title.includes(title.substring(0, 30))
    );

    if (isDuplicate) {
      results.push({ success: true, localAppointmentId: "existing" });
      continue;
    }

    newAppointments.push(localAppointment);
    results.push({ success: true, localAppointmentId: localAppointment.id });
  }

  // Adicionar todos de uma vez ao estado
  if (newAppointments.length > 0) {
    setAppointments((current) => [...(current || []), ...newAppointments]);
    console.log(`[DeadlineIntegration] Added ${newAppointments.length} appointments to calendar`);
  }

  // Sincronizar com Google Calendar em paralelo (se habilitado)
  if (syncToGoogle) {
    await syncBatchToGoogle(analysesWithDeadlines, results);
  }

  return {
    total: analyses.length,
    created: results.filter((r) => r.success && r.localAppointmentId !== "existing").length,
    skipped: results.filter((r) => r.success && r.localAppointmentId === "existing").length,
    errors: results.filter((r) => !r.success).length,
    details: results,
  };
}

async function syncBatchToGoogle(
  analysesWithDeadlines: Array<{ analysis: IntimationAnalysisResult; title: string }>,
  results: DeadlineCreationResult[]
): Promise<void> {
  if (!googleCalendarService.getStatus().authenticated) return;

  const googlePromises = analysesWithDeadlines.map(({ analysis, title }) =>
    syncDeadlineToGoogleCalendar(analysis, title)
  );

  try {
    const googleResults = await Promise.allSettled(googlePromises);
    googleResults.forEach((res, index) => {
      if (res.status === "fulfilled" && res.value) {
        if (results[index]) {
          results[index].googleEventId = res.value;
        }
      }
    });
  } catch (error) {
    console.error("[DeadlineIntegration] Error syncing to Google:", error);
  }
}
