/**
 * API Endpoint: /api/pje-sync
 * Recebe sincronizações da extensão Chrome e processa no backend
 */

import { Redis } from "@upstash/redis";

// ===== Redis singleton (Upstash) =====
const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

let _redisClient: Redis | null = null;

function getRedisOrNull(): Redis | null {
  if (!redisUrl || !redisToken) return null;
  _redisClient ??= new Redis({
    url: redisUrl,
    token: redisToken,
  });
  return _redisClient;
}

const redis = getRedisOrNull();
if (!redis) {
  throw new Error(
    "Redis não configurado - configure UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN"
  );
}

interface ProcessoPJe {
  numero: string;
  numeroFormatado: string;
  classe: string;
  assunto: string;
  parteAutor: string;
  parteReu: string;
  vara: string;
  comarca: string;
  ultimoMovimento: {
    descricao: string;
    data: string;
    timestamp: number;
  };
  situacao: "ativo" | "baixado" | "arquivado";
  valor?: string;
  distribuicao: string;
}

interface Expediente {
  id: string;
  processNumber: string;
  description: string;
  type: "intimacao" | "citacao" | "despacho" | "decisao" | "sentenca" | "outro";
  createdAt: string;
  source: "pje-extension";
  metadata: {
    vara: string;
    comarca: string;
    timestamp: number;
    previousMovement?: string;
  };
}

export const config = {
  maxDuration: 30,
};

export default async function handler(req: Request) {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
    "Content-Type": "application/json",
  };

  // OPTIONS request (CORS preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  // Valida método
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers,
    });
  }

  // Valida API Key
  const apiKey = req.headers.get("X-API-Key");
  if (!apiKey || !(await validateApiKey(apiKey))) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers,
    });
  }

  try {
    const body = await req.json();
    const { type, data } = body;

    console.log(`[PJe Sync] Recebido: ${type}`);

    if (type === "SYNC_PROCESSOS") {
      const processos = data as ProcessoPJe[];
      const synced = await handleSyncProcessos(processos);

      return new Response(JSON.stringify({ success: true, synced }), { status: 200, headers });
    }

    if (type === "SYNC_EXPEDIENTES") {
      const expedientes = data as Expediente[];
      const created = await handleSyncExpedientes(expedientes);

      return new Response(JSON.stringify({ success: true, created }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ success: false, error: "Invalid type" }), {
      status: 400,
      headers,
    });
  } catch (error) {
    console.error("[PJe Sync] Erro:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal error",
      }),
      { status: 500, headers }
    );
  }
}

async function validateApiKey(key: string): Promise<boolean> {
  // Por ora, aceita qualquer key não-vazia
  // TODO: Implementar validação real com KV storage
  return key.length > 10;
}

async function handleSyncProcessos(processos: ProcessoPJe[]): Promise<number> {
  if (!redis) {
    throw new Error("Redis não disponível");
  }

  let syncedCount = 0;

  for (const processo of processos) {
    const key = `processo:${processo.numero}`;
    const existing = (await redis.get(key)) as ProcessoPJe | null;

    // Detecta mudanças
    const hasChanges =
      !existing || existing.ultimoMovimento?.timestamp !== processo.ultimoMovimento.timestamp;

    if (hasChanges) {
      // Salva processo atualizado
      await redis.set(key, processo);
      syncedCount++;

      // Se é atualização (não novo), cria expediente
      if (existing) {
        await createExpedienteFromChange(processo, existing);
      }
    }
  }

  // Atualiza lista geral
  await redis.set("processos:pje-extension", processos);
  await redis.set("processos:last_sync", Date.now());

  console.log(`[PJe Sync] ${syncedCount} processos sincronizados`);
  return syncedCount;
}

async function handleSyncExpedientes(expedientes: Expediente[]): Promise<number> {
  if (!redis) {
    throw new Error("Redis não disponível");
  }

  for (const exp of expedientes) {
    // Salva expediente
    await redis.lpush("expedientes", JSON.stringify(exp));

    // Dispara Mrs. Justin-e para análise
    await triggerJustineAgent(exp);
  }

  console.log(`[PJe Sync] ${expedientes.length} expedientes processados`);
  return expedientes.length;
}

async function createExpedienteFromChange(novo: ProcessoPJe, antigo: ProcessoPJe): Promise<void> {
  if (!redis) {
    throw new Error("Redis não disponível");
  }

  const expediente: Expediente = {
    id: crypto.randomUUID(),
    processNumber: novo.numeroFormatado,
    description: novo.ultimoMovimento.descricao,
    type: detectExpedienteType(novo.ultimoMovimento.descricao),
    createdAt: new Date(novo.ultimoMovimento.timestamp).toISOString(),
    source: "pje-extension",
    metadata: {
      vara: novo.vara,
      comarca: novo.comarca,
      timestamp: novo.ultimoMovimento.timestamp,
      previousMovement: antigo.ultimoMovimento.descricao,
    },
  };

  await redis.lpush("expedientes", JSON.stringify(expediente));
  await triggerJustineAgent(expediente);
}

function detectExpedienteType(movimento: string): Expediente["type"] {
  const lower = movimento.toLowerCase();

  if (lower.includes("intimação") || lower.includes("intimacao") || lower.includes("publicad")) {
    return "intimacao";
  }
  if (lower.includes("citação") || lower.includes("citacao")) {
    return "citacao";
  }
  if (lower.includes("despacho")) {
    return "despacho";
  }
  if (lower.includes("decisão") || lower.includes("decisao")) {
    return "decisao";
  }
  if (lower.includes("sentença") || lower.includes("sentenca")) {
    return "sentenca";
  }

  return "outro";
}

async function triggerJustineAgent(expediente: Expediente): Promise<void> {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:5173";

    await fetch(`${baseUrl}/api/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: "justine",
        action: "ANALYZE_EXPEDIENTE",
        data: expediente,
      }),
    });

    console.log(`[PJe Sync] Mrs. Justin-e disparada para ${expediente.processNumber}`);
  } catch (error) {
    console.error("[PJe Sync] Erro ao disparar agente:", error);
  }
}
