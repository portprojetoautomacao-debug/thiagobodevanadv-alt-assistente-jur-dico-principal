// api/agents/log.ts
// Wrapper endpoint que alinha com modelo de referência
// Delega para /api/kv internamente

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { agentId, event, payload } = req.body || {};

  if (!agentId || !event) {
    return res.status(400).json({
      ok: false,
      error: "Parâmetros 'agentId' e 'event' são obrigatórios.",
    });
  }

  try {
    // Delega para implementação interna (kv)
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/kv`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "log-agent",
        payload: {
          agentId,
          event,
          data: payload ?? null,
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        ok: false,
        error: errorData.error || "Erro ao registrar log",
        detalhes: errorData,
      });
    }

    const data = await response.json();

    return res.status(200).json({
      ok: true,
      log: data.log || data,
      logId: data.id || data.log?.id,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[api/agents/log] Erro:", err);
    return res.status(500).json({
      ok: false,
      error: "Erro ao registrar log",
      message: err.message,
    });
  }
}
