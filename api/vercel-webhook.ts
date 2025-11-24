/**
 * Vercel Webhook Handler
 * Processa eventos enviados pelo Vercel
 *
 * Endpoint: /api/vercel-webhook
 * Configurado em: https://vercel.com/dashboard → Team Settings → Webhooks
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Tipos de eventos que processamos do Vercel
interface VercelWebhookEvent {
  id: string;
  type: string;
  created: number;
  payload: {
    deployment?: {
      id: string;
      url: string;
      name: string;
      meta?: {
        githubCommitSha?: string;
        githubCommitMessage?: string;
        githubCommitAuthorName?: string;
      };
    };
    project?: {
      id: string;
      name: string;
    };
    user?: {
      id: string;
      username: string;
    };
    team?: {
      id: string;
      name: string;
    };
    domain?: {
      id: string;
      name: string;
    };
    certificate?: {
      id: string;
      cns?: string[];
    };
  };
}

/**
 * Valida o token do webhook do Vercel
 */
function validateVercelToken(
  token: string | undefined,
  expectedToken: string | undefined
): boolean {
  if (!expectedToken || !token) {
    console.warn('[Vercel Webhook] Token não configurado ou não enviado');
    return false;
  }

  return token === expectedToken;
}

/**
 * Processa eventos específicos do Vercel
 */
async function processVercelEvent(event: VercelWebhookEvent): Promise<void> {
  console.log(`[Vercel Webhook] Processando evento: ${event.type}`);

  switch (event.type) {
    case 'deployment.succeeded':
      console.log(`[Vercel Webhook] Deployment bem-sucedido: ${event.payload.deployment?.name}`);
      console.log(`[Vercel Webhook] URL: ${event.payload.deployment?.url}`);
      console.log(`[Vercel Webhook] Commit: ${event.payload.deployment?.meta?.githubCommitMessage}`);
      break;

    case 'deployment.failed':
      console.log(`[Vercel Webhook] Deployment falhou: ${event.payload.deployment?.name}`);
      console.log(`[Vercel Webhook] URL: ${event.payload.deployment?.url}`);
      break;

    case 'deployment.created':
      console.log(`[Vercel Webhook] Deployment criado: ${event.payload.deployment?.name}`);
      break;

    case 'deployment.cancelled':
      console.log(`[Vercel Webhook] Deployment cancelado: ${event.payload.deployment?.name}`);
      break;

    case 'domain.created':
      console.log(`[Vercel Webhook] Domínio criado: ${event.payload.domain?.name}`);
      break;

    case 'domain.deleted':
      console.log(`[Vercel Webhook] Domínio removido: ${event.payload.domain?.name}`);
      break;

    case 'domain.verified':
      console.log(`[Vercel Webhook] Domínio verificado: ${event.payload.domain?.name}`);
      break;

    case 'certificate.created':
      console.log(`[Vercel Webhook] Certificado criado para: ${event.payload.certificate?.cns?.join(', ')}`);
      break;

    case 'certificate.deleted':
      console.log(`[Vercel Webhook] Certificado removido`);
      break;

    default:
      console.log(`[Vercel Webhook] Evento não processado: ${event.type}`);
  }

  // Aqui você pode adicionar lógica adicional como:
  // - Notificar sistemas externos sobre deployments
  // - Atualizar dashboards de monitoramento
  // - Disparar ações automatizadas
  // - Integrar com ferramentas de CI/CD
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apenas aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Obter token do header Authorization ou x-vercel-token
    const authHeader = req.headers['authorization'];
    const vercelToken = authHeader?.replace('Bearer ', '') || req.headers['x-vercel-token'] as string;
    const expectedToken = process.env.VERCEL_WEBHOOK_SECRET;

    // Validar token
    if (!validateVercelToken(vercelToken, expectedToken)) {
      console.error('[Vercel Webhook] Token inválido');
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Parse do payload
    const payload: VercelWebhookEvent = req.body;
    if (!payload) {
      console.error('[Vercel Webhook] Payload vazio');
      return res.status(400).json({ error: 'Missing payload' });
    }

    console.log(`[Vercel Webhook] Recebido evento: ${payload.type}`);
    console.log(`[Vercel Webhook] Payload:`, JSON.stringify(payload, null, 2));

    // Processar evento
    await processVercelEvent(payload);

    // Responder sucesso
    res.status(200).json({
      status: 'ok',
      event: payload.type,
      processed: true
    });

  } catch (error) {
    console.error('[Vercel Webhook] Erro:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}