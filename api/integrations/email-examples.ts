/**
 * Exemplo de Integração: Usando o Novo Endpoint de Emails com Cron Jobs
 *
 * Este arquivo demonstra como integrar o novo sistema de emails
 * (api/emails.ts e api/lib/email-service.ts) com os cron jobs existentes.
 *
 * IMPORTANTE: Esta é uma REFERÊNCIA. Para uso em produção:
 * 1. Copie as funções que precisar
 * 2. Adapte para seus casos de uso
 * 3. Teste completamente antes de fazer deploy
 */

/**
 * Exemplo 1: Chamar o endpoint de emails dentro de um cron job
 * Envie notificações após detectar novas intimações
 */
export async function exampleCronWithEmailNotification() {
  const recipients = ["usuario1@example.com", "usuario2@example.com"];

  for (const email of recipients) {
    try {
      const response = await fetch(
        `${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "http://localhost:3000"}/api/emails`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "notification",
            to: email,
            subject: "🚨 Nova Intimação Detectada no DJEN",
            message: "Uma nova intimação foi encontrada. Clique para revisar.",
            actionUrl: "https://assistente-juridico-github.vercel.app/dashboard",
          }),
        }
      );

      if (!response.ok) {
        console.error(`Erro ao enviar email para ${email}:`, response.statusText);
      } else {
        console.log(`✅ Email enviado para ${email}`);
      }
    } catch (error) {
      console.error(`Erro ao enviar email para ${email}:`, error);
    }
  }
}

/**
 * Exemplo 2: Enviar alerta urgente de prazo crítico
 * Útil para prazos com menos de 24 horas
 */
export async function exampleSendUrgentDeadlineAlert(
  email: string,
  processNumber: string,
  deadline: string
) {
  try {
    const response = await fetch(
      `${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "http://localhost:3000"}/api/emails`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "urgent",
          to: email,
          processNumber,
          deadline,
        }),
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao enviar alerta urgente:", error);
    throw error;
  }
}

/**
 * Exemplo 3: Enviar resumo diário com métricas do sistema
 * Ideal para rodada diariamente (ex: 21:00 BRT = 00:00 UTC)
 */
export async function exampleSendDailySummary(
  email: string,
  stats: {
    totalProcesses: number;
    newIntimations: number;
    deadlineAlerts: number;
    completedTasks: number;
    pendingReview: number;
  }
) {
  try {
    const response = await fetch(
      `${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "http://localhost:3000"}/api/emails`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "daily_summary",
          to: email,
          summary: stats,
        }),
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao enviar resumo diário:", error);
    throw error;
  }
}

/**
 * Exemplo 4: Usar a biblioteca email-service diretamente (dentro do Vercel)
 * Mais eficiente que fazer requisições HTTP ao próprio endpoint
 */
/**
 * Exemplo 4: Usar a biblioteca email-service diretamente (dentro do Vercel)
 * Mais eficiente que fazer requisições HTTP ao próprio endpoint
 *
 * NOTA: Requer instalação da dependência resend: npm install resend
 */
export async function exampleDirectEmailServiceUsage() {
  // Importar diretamente (funciona apenas em api/*)
  // Descomente após instalar: npm install resend
  /*
  const { sendNotificationEmail, sendUrgentDeadlineAlert, sendDailySummaryEmail } =
    await import("../lib/email-service");

  // Enviar notificação
  await sendNotificationEmail(
    "usuario@example.com",
    "Petição Pronta para Revisão",
    "Sua petição foi gerada e aguarda revisão."
  );

  // Enviar alerta urgente
  await sendUrgentDeadlineAlert("usuario@example.com", "1234567-89.2024.5.02.0999", "2024-12-25");

  // Enviar resumo
  await sendDailySummaryEmail("usuario@example.com", {
    totalProcesses: 42,
    newIntimations: 3,
    deadlineAlerts: 1,
    completedTasks: 15,
    pendingReview: 2,
  });
  */

  console.log("Email service não configurado. Instale resend: npm install resend");
}

/**
 * Exemplo 5: Integração Completa com Cron Job de DJEN
 * Estrutura base para adicionar a cron.ts existente
 */
export async function exampleCompleteCronIntegration() {
  console.log("[Email Cron] Iniciando monitoramento DJEN com notificações...");

  // Buscar intimações monitoradas
  const monitoredLawyers: Array<{ id: string; email: string; registry: string }> = [
    // { id: "1", email: "usuario@example.com", registry: "123456" }
  ];

  for (const lawyer of monitoredLawyers) {
    try {
      // Simular busca de novas intimações
      const newIntimations: Array<{ processNumber: string; deadline: string }> = [
        // { processNumber: "1234567-89.2024.5.02.0999", deadline: "2024-12-25" }
      ];

      // Se houver intimações, enviar alertas
      for (const intimation of newIntimations) {
        const urgentResponse = await fetch("/api/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "urgent",
            to: lawyer.email,
            processNumber: intimation.processNumber,
            deadline: intimation.deadline,
          }),
        });

        if (urgentResponse.ok) {
          console.log(
            `✅ Alerta urgente enviado para ${lawyer.email} - ${intimation.processNumber}`
          );
        }
      }

      // Enviar resumo geral ao final
      const summaryResponse = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "daily_summary",
          to: lawyer.email,
          summary: {
            totalProcesses: 15,
            newIntimations: newIntimations.length,
            deadlineAlerts: newIntimations.length,
            completedTasks: 8,
            pendingReview: 2,
          },
        }),
      });

      if (summaryResponse.ok) {
        console.log(`✅ Resumo enviado para ${lawyer.email}`);
      }
    } catch (error) {
      console.error(`Erro ao processar ${lawyer.email}:`, error);
    }
  }
}

/**
 * Exemplo 6: Função Helper para enviar emails com retry
 * Útil para garantir entrega em caso de falhas temporárias
 */
export async function sendEmailWithRetry(
  payload: Record<string, unknown>,
  maxRetries = 3
): Promise<boolean> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const _data = await response.json();
        console.log(`✅ Email enviado com sucesso (tentativa ${attempt})`);
        return true;
      } else {
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Erro desconhecido ao enviar email");
    }

    // Aguardar antes de retry (exponential backoff)
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
      console.log(`⏳ Aguardando ${delay}ms antes de retry ${attempt + 1}/${maxRetries}...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.error(`❌ Falha ao enviar email após ${maxRetries} tentativas:`, lastError);
  return false;
}

/**
 * Exemplo 7: Batching de emails para performance
 * Envia múltiplos emails em paralelo mas com controle de concorrência
 */
export async function sendEmailsBatch(
  payloads: Array<Record<string, unknown>>,
  concurrency = 3
): Promise<Array<{ success: boolean; messageId?: string; error?: string }>> {
  const results: Array<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> = [];

  // Processar em lotes
  for (let i = 0; i < payloads.length; i += concurrency) {
    const batch = payloads.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(async (payload) => {
        try {
          const response = await fetch("/api/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            const data = await response.json();
            return { success: true, messageId: data.messageId };
          } else {
            return { success: false, error: response.statusText };
          }
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Erro desconhecido",
          };
        }
      })
    );

    results.push(...batchResults);
  }

  return results;
}

/**
 * Exemplo 8: Monitoramento e Logging
 * Rastreie envios de email para auditoria e troubleshooting
 */
export async function logEmailSent(
  payload: Record<string, unknown>,
  result: { success: boolean; messageId?: string; error?: string }
) {
  const timestamp = new Date().toISOString();

  console.log(
    JSON.stringify(
      {
        timestamp,
        action: "email_sent",
        to: payload.to,
        type: payload.type,
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      },
      null,
      2
    )
  );

  // Opcionalmente, salvar em KV storage para auditoria
  // await kv.lpush('email-audit-log', { ... })
}

/**
 * COMO USAR ESTES EXEMPLOS:
 *
 * 1. Em um cron job (api/cron.ts):
 *    import { exampleSendUrgentDeadlineAlert } from './integrations/email-examples.js'
 *    await exampleSendUrgentDeadlineAlert('user@example.com', '1234...', '2024-12-25')
 *
 * 2. Com retry:
 *    import { sendEmailWithRetry } from './integrations/email-examples.js'
 *    await sendEmailWithRetry({ type: 'test', to: 'user@example.com' })
 *
 * 3. Em batch:
 *    import { sendEmailsBatch } from './integrations/email-examples.js'
 *    const results = await sendEmailsBatch([...payloads])
 *
 * 4. Diretamente:
 *    import { sendNotificationEmail } from './lib/email-service.js'
 *    await sendNotificationEmail('user@example.com', 'Título', 'Mensagem')
 */
