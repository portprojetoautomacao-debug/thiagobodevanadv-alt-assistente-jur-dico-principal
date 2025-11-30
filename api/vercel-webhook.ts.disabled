/**
 * Vercel Webhook Handler
 * Processa eventos enviados pelo Vercel
 *
 * Endpoint: /api/vercel-webhook
 * Configurado em: https://vercel.com/dashboard → Team Settings → Webhooks
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';

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
 * Valida a assinatura do webhook do Vercel usando HMAC-SHA1
 */
function validateVercelSignature(
  payload: string,
  signature: string | undefined,
  secret: string | undefined
): boolean {
  if (!secret || !signature) {
    console.warn('[Vercel Webhook] Segredo ou assinatura não configurados');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha1', secret)
    .update(payload)
    .digest('hex');

  return expectedSignature === signature;
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

  // Disparar evento no GitHub Actions para automação
  await triggerGitHubAction(event);
}

/**
 * Dispara evento no GitHub Actions via repository_dispatch
 */
async function triggerGitHubAction(event: VercelWebhookEvent): Promise<void> {
  const githubToken = process.env.GITHUB_TOKEN;
  const repoOwner = process.env.GITHUB_REPO_OWNER;
  const repoName = process.env.GITHUB_REPO_NAME;

  if (!githubToken || !repoOwner || !repoName) {
    console.warn('[GitHub Dispatch] Configuração incompleta - pulando dispatch');
    return;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: 'vercel-deployment',
          client_payload: event
        })
      }
    );

    if (response.ok) {
      console.log('[GitHub Dispatch] Evento enviado com sucesso para GitHub Actions');
    } else {
      console.error(`[GitHub Dispatch] Falha ao enviar evento: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('[GitHub Dispatch] Erro ao enviar evento:', error);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apenas aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Obter o payload como string para validação
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['x-vercel-signature'] as string;
    const secret = process.env.VERCEL_WEBHOOK_SECRET;

    // Validar assinatura HMAC-SHA1
    if (!validateVercelSignature(rawBody, signature, secret)) {
      console.error('[Vercel Webhook] Assinatura inválida');
      return res.status(401).json({ error: 'Invalid signature' });
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