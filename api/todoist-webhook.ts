/**
 * Todoist Webhook Handler
 * Recebe eventos do Todoist e encaminha para o Agente de IA
 * 
 * Endpoint: /api/todoist-webhook
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { todoistAgent } from '../src/lib/agents/todoist-agent';
import { initializeTodoistClient } from '../src/lib/todoist-integration';
import { config } from '../src/lib/config';

// Inicializar cliente ao carregar a função (cold start)
if (config.todoist.apiKey) {
  initializeTodoistClient(config.todoist.apiKey);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verificar método
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;
    
    // Log para debug
    console.log('Webhook Todoist recebido:', JSON.stringify(event, null, 2));

    // Processar evento com o Agente
    await todoistAgent.processWebhookEvent(event);

    // Responder rápido para o Todoist (timeout é curto)
    return res.status(200).json({ status: 'processed' });
  } catch (error) {
    console.error('Erro ao processar webhook do Todoist:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
