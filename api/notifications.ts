/**
 * API de Notificações
 * 
 * Endpoints:
 * - GET /api/notifications - Lista notificações pendentes
 * - POST /api/notifications/send - Envia notificação (email/webhook)
 * - POST /api/notifications/webhook - Configura webhook externo
 * - POST /api/notifications/process - Processa fila de notificações
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

// Constantes
const KV_KEYS = {
  NOTIFICATION_QUEUE: 'notification-queue',
  NOTIFICATION_SETTINGS: 'notification-settings',
  NOTIFICATION_LOG: 'notification-log',
  WEBHOOKS: 'configured-webhooks'
} as const;

// Tipos
interface Notification {
  id: string;
  type: 'new_publication' | 'deadline_reminder' | 'system_alert' | 'custom';
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  recipientEmail?: string;
  recipientWebhook?: string;
  metadata?: {
    publicationId?: string;
    lawyerId?: string;
    processNumber?: string;
    tribunal?: string;
    [key: string]: unknown;
  };
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  createdAt: string;
  sentAt?: string;
  error?: string;
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  type: 'slack' | 'discord' | 'teams' | 'generic';
  enabled: boolean;
  events: string[];
  secret?: string;
  createdAt: string;
}

interface NotificationSettings {
  emailEnabled: boolean;
  webhookEnabled: boolean;
  emailFrom?: string;
  emailSmtpHost?: string;
  slackWebhookUrl?: string;
  discordWebhookUrl?: string;
  teamsWebhookUrl?: string;
  minPriority: 'low' | 'normal' | 'high' | 'urgent';
}

// Redis client
async function getKv(): Promise<Redis> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Upstash Redis not configured');
  }
  
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL.trim(),
    token: process.env.UPSTASH_REDIS_REST_TOKEN.trim(),
  });
}

// Gera ID único
function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Envia webhook para Slack
async function sendSlackWebhook(webhookUrl: string, notification: Notification): Promise<boolean> {
  try {
    const priorityEmoji = {
      low: 'ℹ️',
      normal: '📢',
      high: '⚠️',
      urgent: '🚨'
    };

    const payload = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${priorityEmoji[notification.priority]} ${notification.title}`,
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: notification.message
          }
        }
      ],
      attachments: notification.metadata ? [{
        color: notification.priority === 'urgent' ? '#ff0000' : 
               notification.priority === 'high' ? '#ff9900' : '#36a64f',
        fields: Object.entries(notification.metadata)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => ({
            title: k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1'),
            value: String(v),
            short: true
          }))
      }] : undefined
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return response.ok;
  } catch (error) {
    console.error('[Notification] Slack webhook error:', error);
    return false;
  }
}

// Envia webhook para Discord
async function sendDiscordWebhook(webhookUrl: string, notification: Notification): Promise<boolean> {
  try {
    const priorityColor = {
      low: 0x808080,
      normal: 0x00ff00,
      high: 0xffa500,
      urgent: 0xff0000
    };

    const payload = {
      embeds: [{
        title: notification.title,
        description: notification.message,
        color: priorityColor[notification.priority],
        timestamp: new Date().toISOString(),
        fields: notification.metadata ? Object.entries(notification.metadata)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => ({
            name: k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1'),
            value: String(v),
            inline: true
          })) : [],
        footer: {
          text: 'Assistente Jurídico PJe'
        }
      }]
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return response.ok;
  } catch (error) {
    console.error('[Notification] Discord webhook error:', error);
    return false;
  }
}

// Envia webhook para Microsoft Teams
async function sendTeamsWebhook(webhookUrl: string, notification: Notification): Promise<boolean> {
  try {
    const priorityColor = {
      low: '808080',
      normal: '00ff00',
      high: 'ffa500',
      urgent: 'ff0000'
    };

    const payload = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: priorityColor[notification.priority],
      summary: notification.title,
      sections: [{
        activityTitle: notification.title,
        activitySubtitle: new Date().toLocaleString('pt-BR'),
        text: notification.message,
        facts: notification.metadata ? Object.entries(notification.metadata)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => ({
            name: k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1'),
            value: String(v)
          })) : []
      }]
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return response.ok;
  } catch (error) {
    console.error('[Notification] Teams webhook error:', error);
    return false;
  }
}

// Envia webhook genérico
async function sendGenericWebhook(webhookUrl: string, notification: Notification, secret?: string): Promise<boolean> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    
    if (secret) {
      // Simple HMAC signature
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(JSON.stringify(notification))
      );
      headers['X-Signature'] = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        event: notification.type,
        timestamp: new Date().toISOString(),
        data: notification
      })
    });

    return response.ok;
  } catch (error) {
    console.error('[Notification] Generic webhook error:', error);
    return false;
  }
}

// Envia email via Resend API (se configurado)
async function sendEmail(notification: Notification, settings: NotificationSettings): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey || !notification.recipientEmail) {
    console.log('[Notification] Email skipped - no API key or recipient');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: settings.emailFrom || 'Assistente Juridico <noreply@resend.dev>',
        to: notification.recipientEmail,
        subject: `[${notification.priority.toUpperCase()}] ${notification.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${notification.title}</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">${notification.message}</p>
            ${notification.metadata ? `
              <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <h4 style="margin: 0 0 10px 0; color: #333;">Detalhes:</h4>
                <ul style="margin: 0; padding-left: 20px;">
                  ${Object.entries(notification.metadata)
                    .filter(([_, v]) => v !== undefined)
                    .map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`)
                    .join('')}
                </ul>
              </div>
            ` : ''}
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #999; font-size: 12px;">
              Enviado pelo Assistente Jurídico PJe
            </p>
          </div>
        `
      })
    });

    return response.ok;
  } catch (error) {
    console.error('[Notification] Email error:', error);
    return false;
  }
}

// Handler principal
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const kv = await getKv();
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const path = url.pathname.replace('/api/notifications', '');

    // GET /api/notifications - Lista notificações
    if (req.method === 'GET' && !path) {
      const queue = await kv.get<Notification[]>(KV_KEYS.NOTIFICATION_QUEUE) || [];
      const settings = await kv.get<NotificationSettings>(KV_KEYS.NOTIFICATION_SETTINGS);
      const webhooks = await kv.get<WebhookConfig[]>(KV_KEYS.WEBHOOKS) || [];
      
      return res.status(200).json({
        success: true,
        notifications: queue.slice(0, 50),
        pendingCount: queue.filter(n => n.status === 'pending').length,
        totalCount: queue.length,
        settings: settings || {
          emailEnabled: false,
          webhookEnabled: true,
          minPriority: 'normal'
        },
        webhooks: webhooks.map(w => ({ ...w, secret: undefined })) // Hide secrets
      });
    }

    // POST /api/notifications/send - Envia notificação
    if (req.method === 'POST' && path === '/send') {
      const { type, title, message, priority, recipientEmail, metadata } = req.body;
      
      if (!title || !message) {
        return res.status(400).json({ error: 'title and message required' });
      }

      const notification: Notification = {
        id: generateId(),
        type: type || 'custom',
        title,
        message,
        priority: priority || 'normal',
        recipientEmail,
        metadata,
        status: 'pending',
        attempts: 0,
        createdAt: new Date().toISOString()
      };

      // Get settings and webhooks
      const settings = await kv.get<NotificationSettings>(KV_KEYS.NOTIFICATION_SETTINGS) || {
        emailEnabled: false,
        webhookEnabled: true,
        minPriority: 'normal'
      };
      
      const webhooks = await kv.get<WebhookConfig[]>(KV_KEYS.WEBHOOKS) || [];
      
      // Check priority threshold
      const priorityOrder = ['low', 'normal', 'high', 'urgent'];
      const notifPriority = priorityOrder.indexOf(notification.priority);
      const minPriority = priorityOrder.indexOf(settings.minPriority);
      
      if (notifPriority < minPriority) {
        return res.status(200).json({
          success: true,
          message: 'Notification skipped due to priority threshold',
          notification
        });
      }

      const results: { channel: string; success: boolean; error?: string }[] = [];

      // Send to configured webhooks
      if (settings.webhookEnabled) {
        for (const webhook of webhooks.filter(w => w.enabled)) {
          let success = false;
          try {
            switch (webhook.type) {
              case 'slack':
                success = await sendSlackWebhook(webhook.url, notification);
                break;
              case 'discord':
                success = await sendDiscordWebhook(webhook.url, notification);
                break;
              case 'teams':
                success = await sendTeamsWebhook(webhook.url, notification);
                break;
              default:
                success = await sendGenericWebhook(webhook.url, notification, webhook.secret);
            }
            results.push({ channel: webhook.name, success });
          } catch (e) {
            results.push({ channel: webhook.name, success: false, error: String(e) });
          }
        }
      }

      // Send email
      if (settings.emailEnabled && notification.recipientEmail) {
        const emailSuccess = await sendEmail(notification, settings);
        results.push({ channel: 'email', success: emailSuccess });
      }

      // Update notification status
      notification.status = results.some(r => r.success) ? 'sent' : 'failed';
      notification.sentAt = notification.status === 'sent' ? new Date().toISOString() : undefined;
      notification.attempts = 1;

      // Save to queue/log
      const queue = await kv.get<Notification[]>(KV_KEYS.NOTIFICATION_QUEUE) || [];
      queue.unshift(notification);
      await kv.set(KV_KEYS.NOTIFICATION_QUEUE, queue.slice(0, 500));

      return res.status(200).json({
        success: true,
        notification,
        results
      });
    }

    // POST /api/notifications/webhook - Configura webhook
    if (req.method === 'POST' && path === '/webhook') {
      const { name, url, type, events, secret } = req.body;
      
      if (!name || !url || !type) {
        return res.status(400).json({ error: 'name, url and type required' });
      }

      const webhook: WebhookConfig = {
        id: generateId(),
        name,
        url,
        type,
        enabled: true,
        events: events || ['all'],
        secret,
        createdAt: new Date().toISOString()
      };

      const webhooks = await kv.get<WebhookConfig[]>(KV_KEYS.WEBHOOKS) || [];
      webhooks.push(webhook);
      await kv.set(KV_KEYS.WEBHOOKS, webhooks);

      return res.status(201).json({
        success: true,
        webhook: { ...webhook, secret: undefined }
      });
    }

    // DELETE /api/notifications/webhook/:id - Remove webhook
    if (req.method === 'DELETE' && path.startsWith('/webhook/')) {
      const webhookId = path.replace('/webhook/', '');
      const webhooks = await kv.get<WebhookConfig[]>(KV_KEYS.WEBHOOKS) || [];
      const filtered = webhooks.filter(w => w.id !== webhookId);
      
      if (filtered.length === webhooks.length) {
        return res.status(404).json({ error: 'Webhook not found' });
      }
      
      await kv.set(KV_KEYS.WEBHOOKS, filtered);
      
      return res.status(200).json({ success: true });
    }

    // PUT /api/notifications/settings - Atualiza configurações
    if (req.method === 'PUT' && path === '/settings') {
      const settings = req.body as Partial<NotificationSettings>;
      
      const current = await kv.get<NotificationSettings>(KV_KEYS.NOTIFICATION_SETTINGS) || {};
      const updated = { ...current, ...settings };
      
      await kv.set(KV_KEYS.NOTIFICATION_SETTINGS, updated);
      
      return res.status(200).json({
        success: true,
        settings: updated
      });
    }

    // POST /api/notifications/test - Testa notificação
    if (req.method === 'POST' && path === '/test') {
      const { webhookId } = req.body;
      
      const webhooks = await kv.get<WebhookConfig[]>(KV_KEYS.WEBHOOKS) || [];
      const webhook = webhookId 
        ? webhooks.find(w => w.id === webhookId)
        : webhooks.find(w => w.enabled);
      
      if (!webhook) {
        return res.status(404).json({ error: 'No webhook configured' });
      }

      const testNotification: Notification = {
        id: generateId(),
        type: 'system_alert',
        title: '🧪 Teste de Notificação',
        message: 'Esta é uma notificação de teste do Assistente Jurídico PJe. Se você recebeu esta mensagem, as notificações estão configuradas corretamente!',
        priority: 'normal',
        status: 'pending',
        attempts: 0,
        createdAt: new Date().toISOString(),
        metadata: {
          source: 'test',
          timestamp: new Date().toISOString()
        }
      };

      let success = false;
      switch (webhook.type) {
        case 'slack':
          success = await sendSlackWebhook(webhook.url, testNotification);
          break;
        case 'discord':
          success = await sendDiscordWebhook(webhook.url, testNotification);
          break;
        case 'teams':
          success = await sendTeamsWebhook(webhook.url, testNotification);
          break;
        default:
          success = await sendGenericWebhook(webhook.url, testNotification, webhook.secret);
      }

      return res.status(200).json({
        success,
        message: success ? 'Test notification sent successfully' : 'Failed to send test notification',
        webhook: { name: webhook.name, type: webhook.type }
      });
    }

    return res.status(404).json({ error: 'Not found' });

  } catch (error) {
    console.error('[Notifications API] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
