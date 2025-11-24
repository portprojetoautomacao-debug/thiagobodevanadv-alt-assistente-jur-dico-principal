/**
 * GitLab Webhook Handler
 * Processa eventos enviados pelo GitLab
 *
 * Endpoint: /api/gitlab-webhook
 * Configurado em: https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p/-/hooks
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Tipos de eventos que processamos do GitLab
interface GitLabWebhookEvent {
  object_kind: string;
  event_type?: string;
  ref?: string;
  checkout_sha?: string;
  message?: string;
  object_attributes?: {
    id?: number;
    iid?: number;
    title?: string;
    state?: string;
    action?: string;
    description?: string;
    status?: string; // Adicionado para pipeline e job events
  };
  project?: {
    id: number;
    name: string;
    path_with_namespace: string;
  };
  repository?: {
    name: string;
    url: string;
  };
  user?: {
    id: number;
    name: string;
    username: string;
  };
  commits?: Array<{
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
  }>;
}

/**
 * Valida o token do webhook do GitLab
 */
function validateGitLabToken(
  token: string | undefined,
  expectedToken: string | undefined
): boolean {
  if (!expectedToken || !token) {
    console.warn('[GitLab Webhook] Token não configurado ou não enviado');
    return false;
  }

  return token === expectedToken;
}

/**
 * Processa eventos específicos do GitLab
 */
async function processGitLabEvent(event: string, payload: GitLabWebhookEvent): Promise<void> {
  console.log(`[GitLab Webhook] Processando evento: ${event}`);

  switch (event) {
    case 'push':
      console.log(`[GitLab Webhook] Push para: ${payload.ref}`);
      console.log(`[GitLab Webhook] Commits: ${payload.commits?.length || 0}`);
      console.log(`[GitLab Webhook] Projeto: ${payload.project?.path_with_namespace}`);

      // Processar commits
      if (payload.commits) {
        payload.commits.forEach(commit => {
          console.log(`[GitLab Webhook] Commit ${commit.id}: ${commit.message}`);
        });
      }
      break;

    case 'note':
      console.log(`[GitLab Webhook] Comentário: ${payload.object_attributes?.action}`);
      console.log(`[GitLab Webhook] Em: ${payload.object_attributes?.title}`);
      break;

    case 'issue':
      console.log(`[GitLab Webhook] Issue #${payload.object_attributes?.iid}: ${payload.object_attributes?.action}`);
      console.log(`[GitLab Webhook] Título: ${payload.object_attributes?.title}`);
      break;

    case 'merge_request':
      console.log(`[GitLab Webhook] MR #${payload.object_attributes?.iid}: ${payload.object_attributes?.action}`);
      console.log(`[GitLab Webhook] Título: ${payload.object_attributes?.title}`);
      break;

    case 'pipeline':
      console.log(`[GitLab Webhook] Pipeline: ${payload.object_attributes?.status}`);
      break;

    case 'job':
      console.log(`[GitLab Webhook] Job: ${payload.object_attributes?.status}`);
      break;

    default:
      console.log(`[GitLab Webhook] Evento não processado: ${event}`);
  }

  // Aqui você pode adicionar lógica adicional como:
  // - Disparar builds automáticos
  // - Notificar sistemas externos
  // - Atualizar dashboards
  // - Integrar com outros serviços
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apenas aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Obter token do header X-Gitlab-Token
    const gitlabToken = req.headers['x-gitlab-token'] as string;
    const expectedToken = process.env.GITLAB_WEBHOOK_SECRET;

    // Validar token
    if (!validateGitLabToken(gitlabToken, expectedToken)) {
      console.error('[GitLab Webhook] Token inválido');
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Obter tipo de evento
    const eventType = req.headers['x-gitlab-event'] as string;
    if (!eventType) {
      console.error('[GitLab Webhook] Tipo de evento não especificado');
      return res.status(400).json({ error: 'Missing event type' });
    }

    // Parse do payload
    const payload: GitLabWebhookEvent = req.body;
    if (!payload) {
      console.error('[GitLab Webhook] Payload vazio');
      return res.status(400).json({ error: 'Missing payload' });
    }

    console.log(`[GitLab Webhook] Recebido evento: ${eventType}`);
    console.log(`[GitLab Webhook] Payload:`, JSON.stringify(payload, null, 2));

    // Processar evento
    await processGitLabEvent(eventType, payload);

    // Responder sucesso
    res.status(200).json({
      status: 'ok',
      event: eventType,
      processed: true
    });

  } catch (error) {
    console.error('[GitLab Webhook] Erro:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}