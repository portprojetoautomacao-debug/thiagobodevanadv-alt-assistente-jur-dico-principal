/**
 * Todoist Webhook Handler
 * Recebe eventos do Todoist e encaminha para o Agente de IA
 * 
 * Endpoint: /api/todoist-webhook
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';
import { todoistAgent } from '../src/lib/agents/todoist-agent';
import { initializeTodoistClient } from '../src/lib/todoist-integration';
import { config } from '../src/lib/config';

// Inicializar cliente ao carregar a função (cold start)
if (config.todoist.apiKey) {
  initializeTodoistClient(config.todoist.apiKey);
}

/**
 * Valida assinatura HMAC do webhook (segurança)
 */
function validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !secret) {
    console.warn('⚠️ Webhook sem validação HMAC (falta X-Todoist-Hmac-SHA256 ou TODOIST_WEBHOOK_SECRET)');
    return true; // Aceitar se não configurado (modo dev)
  }

  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('base64');

  return signature === expectedSignature;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verificar método
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validar assinatura HMAC (se configurado)
    const signature = req.headers['x-todoist-hmac-sha256'] as string;
    const secret = process.env.TODOIST_WEBHOOK_SECRET || '';
    const payload = JSON.stringify(req.body);

    if (!validateWebhookSignature(payload, signature, secret)) {
      console.error('🚨 Webhook rejeitado: assinatura HMAC inválida');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    
    // Log para debug
    console.log('📥 Webhook Todoist recebido:', JSON.stringify(event, null, 2));

    // Processar evento com o Agente
    await todoistAgent.processWebhookEvent(event);

    // Responder rápido para o Todoist (timeout é curto)
    return res.status(200).json({ status: 'processed' });
  } catch (error) {
    console.error('❌ Erro ao processar webhook do Todoist:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
