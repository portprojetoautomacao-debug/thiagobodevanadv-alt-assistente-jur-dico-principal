/**
 * GitLab Webhook Handler - JavaScript Version
 * Processa eventos enviados pelo GitLab
 */

export default async function handler(req, res) {
  // Apenas para teste - responder sempre com sucesso
  console.log('[GitLab Webhook] Recebido evento de teste');
  
  res.status(200).json({
    status: 'ok',
    message: 'Webhook funcionando',
    timestamp: new Date().toISOString()
  });
}
