import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendEmail, sendNotificationEmail, sendUrgentDeadlineAlert, sendDailySummaryEmail } from './lib/email-service';

/**
 * API Endpoint para enviar emails
 * POST /api/emails
 * 
 * Tipos de email:
 * - "test": Email de teste
 * - "notification": Email de notificação
 * - "urgent": Alerta de prazo urgente
 * - "daily_summary": Resumo diário
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apenas POST permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, to, subject, message, actionUrl, processNumber, deadline, summary } = req.body;

    // Validar tipo
    if (!type) {
      return res.status(400).json({ error: 'Campo "type" é obrigatório' });
    }

    let result;

    switch (type) {
      case 'test':
        // Email de teste
        if (!to) {
          return res.status(400).json({ error: 'Campo "to" é obrigatório' });
        }

        result = await sendEmail({
          to,
          subject: subject || 'Email de Teste - Assistente Jurídico',
          html: `
            <html>
              <body style="font-family: Arial, sans-serif; text-align: center; padding: 40px;">
                <h1 style="color: #1e88e5;">✅ Email de Teste Enviado com Sucesso!</h1>
                <p style="font-size: 16px; color: #666;">
                  Resend está configurado corretamente no Vercel.
                </p>
                <p style="margin-top: 20px; font-size: 14px; color: #999;">
                  Timestamp: ${new Date().toISOString()}
                </p>
              </body>
            </html>
          `,
          tags: [{ name: 'tipo', value: 'teste' }],
        });
        break;

      case 'notification':
        // Email de notificação
        if (!to || !subject || !message) {
          return res.status(400).json({
            error: 'Campos "to", "subject" e "message" são obrigatórios',
          });
        }

        result = await sendNotificationEmail(to, subject, message, actionUrl);
        break;

      case 'urgent':
        // Alerta urgente de prazo
        if (!to || !processNumber || !deadline) {
          return res.status(400).json({
            error: 'Campos "to", "processNumber" e "deadline" são obrigatórios',
          });
        }

        result = await sendUrgentDeadlineAlert(
          to,
          processNumber,
          deadline,
          'Manifestação Processual'
        );
        break;

      case 'daily_summary':
        // Resumo diário
        if (!to || !summary) {
          return res.status(400).json({
            error: 'Campos "to" e "summary" são obrigatórios',
          });
        }

        result = await sendDailySummaryEmail(to, summary);
        break;

      default:
        return res.status(400).json({
          error: `Tipo de email inválido: ${type}. Use: test, notification, urgent, daily_summary`,
        });
    }

    if (result.success) {
      return res.status(200).json({
        success: true,
        messageId: result.messageId,
        message: `Email de tipo "${type}" enviado com sucesso`,
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Erro ao enviar email',
      });
    }
  } catch (error) {
    console.error('Erro no endpoint de emails:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
}
