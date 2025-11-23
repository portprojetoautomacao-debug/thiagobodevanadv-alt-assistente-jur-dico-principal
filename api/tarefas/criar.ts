// api/tarefas/criar.ts
// Wrapper endpoint que alinha com modelo de referência
// Delega para /api/todoist internamente

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { descricao, dueDate, priority } = req.body || {};

  if (!descricao || typeof descricao !== "string") {
    return res.status(400).json({
      ok: false,
      error: "Parâmetro 'descricao' é obrigatório e deve ser texto.",
    });
  }

  try {
    // Delega para implementação interna (todoist)
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/todoist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create-task",
        descricao,
        dueDate: dueDate || undefined,
        priority: priority ?? 1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        ok: false,
        error: errorData.error || "Erro ao criar tarefa",
        detalhes: errorData,
      });
    }

    const data = await response.json();

    return res.status(200).json({
      ok: true,
      tarefa: data.tarefa || data,
      id: data.id || data.tarefa?.id,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[api/tarefas/criar] Erro:", err);
    return res.status(500).json({
      ok: false,
      error: "Erro ao criar tarefa",
      message: err.message,
    });
  }
}
