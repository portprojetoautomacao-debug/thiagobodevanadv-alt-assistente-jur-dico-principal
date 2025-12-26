# 🚀 Plano de Implementação - Quick Wins Multi-Agent

## 📅 Cronograma: 1.5 dias (12 horas)

### ✅ Objetivo
Adicionar **3 melhorias críticas** do Multi-Agent Engine sem alterar arquitetura existente:
1. LLM Cost Tracking (controle de custos)
2. Agent Registry (configuração dinâmica)
3. Agent Telemetry (observabilidade)

---

## 📊 **Quick Win #1: LLM Cost Tracking** (4 horas)

### 🎯 Problema Resolvido
- ❌ Atualmente: Sem visibilidade de gastos com Gemini API
- ✅ Depois: Dashboard com custos por agente, alertas de budget

### 📁 Arquivos a Criar/Modificar

#### 1. Criar serviço de tracking (1h)
```typescript
// src/lib/llm-cost-tracker.ts
import { kv } from '@/lib/upstash-kv';

interface LLMCostMetrics {
  id: string;
  provider: 'gemini' | 'openai';
  model: string;
  agentId: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: Date;
  executionId: string;
}

const PRICING = {
  'gemini-2.5-pro': {
    input: 0.000003,  // $3 per 1M tokens
    output: 0.000009  // $9 per 1M tokens
  }
};

export async function trackLLMCost(metrics: Omit<LLMCostMetrics, 'id' | 'cost'>) {
  const cost = calculateCost(metrics);
  const record: LLMCostMetrics = {
    ...metrics,
    id: crypto.randomUUID(),
    cost
  };

  // Salvar no Redis com TTL de 90 dias
  await kv.set(
    `llm-cost:${record.id}`,
    record,
    { ex: 60 * 60 * 24 * 90 }
  );

  // Incrementar total mensal
  const month = record.timestamp.toISOString().slice(0, 7); // YYYY-MM
  await kv.hincrby(`llm-cost:monthly:${month}`, metrics.agentId, cost);

  return record;
}

function calculateCost(metrics: Omit<LLMCostMetrics, 'id' | 'cost'>): number {
  const pricing = PRICING[metrics.model];
  if (!pricing) return 0;

  const inputCost = (metrics.inputTokens / 1_000_000) * pricing.input;
  const outputCost = (metrics.outputTokens / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}

export async function getMonthlyCosts(month: string) {
  const costs = await kv.hgetall(`llm-cost:monthly:${month}`);
  return costs || {};
}

export async function getTotalCost(startDate: Date, endDate: Date) {
  // Buscar todos registros no período
  // Implementar com scan do Redis ou query estruturada
}
```

#### 2. Integrar no Gemini Service (1h)
```typescript
// src/lib/gemini-service.ts
import { trackLLMCost } from './llm-cost-tracker';

export async function streamGeminiResponse(
  prompt: string,
  options: GeminiOptions = {}
) {
  const executionId = crypto.randomUUID();
  const agentId = options.agentId || 'unknown';

  // Estimar tokens de input (aproximação)
  const inputTokens = estimateTokens(prompt);

  try {
    const model = genAI.getGenerativeModel({ model: options.model || 'gemini-2.5-pro' });
    const result = await model.generateContentStream(prompt);

    let fullText = '';
    let outputTokens = 0;

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      outputTokens += estimateTokens(chunkText);
      yield chunkText;
    }

    // Registrar custo após completar
    await trackLLMCost({
      provider: 'gemini',
      model: options.model || 'gemini-2.5-pro',
      agentId,
      inputTokens,
      outputTokens,
      timestamp: new Date(),
      executionId
    });

  } catch (error) {
    console.error('[Gemini Error]', error);
    throw error;
  }
}

// Função auxiliar para estimar tokens (aproximação)
function estimateTokens(text: string): number {
  // Aproximação: 1 token ≈ 4 caracteres em inglês
  // Para português, usar 1 token ≈ 3.5 caracteres
  return Math.ceil(text.length / 3.5);
}
```

#### 3. Criar API endpoint (30min)
```typescript
// api/llm-costs.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMonthlyCosts } from '../src/lib/llm-cost-tracker';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { month } = req.query;
    const currentMonth = month || new Date().toISOString().slice(0, 7);

    const costs = await getMonthlyCosts(currentMonth as string);

    // Calcular totais
    const total = Object.values(costs).reduce((sum, cost) => sum + (cost as number), 0);

    return res.status(200).json({
      month: currentMonth,
      total,
      byAgent: costs
    });
  } catch (error) {
    console.error('[LLM Costs API Error]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

#### 4. Criar componente Dashboard (1.5h)
```typescript
// src/components/LLMCostsDashboard.tsx
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

interface CostMetrics {
  month: string;
  total: number;
  byAgent: Record<string, number>;
}

export function LLMCostsDashboard() {
  const [costs, setCosts] = useState<CostMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCosts();
  }, []);

  async function fetchCosts() {
    try {
      const res = await fetch('/api/llm-costs');
      const data = await res.json();
      setCosts(data);
    } catch (error) {
      console.error('Failed to fetch costs:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Carregando custos...</div>;
  if (!costs) return <div>Erro ao carregar dados</div>;

  const topAgents = Object.entries(costs.byAgent)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Custo Total (mês)</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${costs.total.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {costs.month}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top 5 Agentes</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topAgents.map(([agentId, cost]) => (
              <div key={agentId} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{agentId}</span>
                <span className="font-medium">${(cost as number).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {costs.total > 50 && (
        <Card className="border-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerta de Budget</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Custo mensal acima do esperado ($50/mês)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

## 📊 **Quick Win #2: Agent Registry** (4 horas)

### 🎯 Problema Resolvido
- ❌ Atualmente: Configuração hardcoded em `src/lib/agents.ts`
- ✅ Depois: Ligar/desligar agentes, A/B testing de prompts

### 📁 Arquivos a Criar/Modificar

#### 1. Criar schema de configuração (30min)
```json
// config/agents-registry.json
{
  "$schema": "./agents-registry.schema.json",
  "version": "2.0.0",
  "agents": [
    {
      "id": "harvey",
      "name": "Harvey Specter",
      "description": "Estrategista-chefe do escritório",
      "enabled": true,
      "priority": 10,
      "capabilities": [
        "strategic-analysis",
        "performance-monitoring",
        "risk-identification"
      ],
      "triggers": ["daily-summary", "critical-deadline"],
      "config": {
        "model": "gemini-2.5-pro",
        "temperature": 0.7,
        "maxTokens": 8000,
        "systemPrompt": "Você é Harvey Specter, estrategista-chefe..."
      }
    },
    {
      "id": "justine",
      "name": "Mrs. Justin-e",
      "description": "Especialista em intimações e prazos",
      "enabled": true,
      "priority": 9,
      "capabilities": [
        "intimation-analysis",
        "deadline-calculation",
        "task-generation"
      ],
      "triggers": ["new_expediente", "djen_publication"],
      "config": {
        "model": "gemini-2.5-pro",
        "temperature": 0.3,
        "maxTokens": 4000,
        "systemPrompt": "Você é especialista em análise de intimações..."
      }
    }
  ]
}
```

#### 2. Criar loader dinâmico (1h)
```typescript
// src/lib/agents-registry.ts
import registry from '../../config/agents-registry.json';

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  capabilities: string[];
  triggers: string[];
  config: {
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
  };
}

// Cache em memória para evitar leitura repetida do JSON
let agentsCache: Map<string, AgentConfig> | null = null;

export function loadAgentsRegistry(): Map<string, AgentConfig> {
  if (agentsCache) return agentsCache;

  agentsCache = new Map(
    registry.agents
      .filter(agent => agent.enabled)
      .map(agent => [agent.id, agent as AgentConfig])
  );

  return agentsCache;
}

export function getAgent(id: string): AgentConfig | null {
  const agents = loadAgentsRegistry();
  return agents.get(id) || null;
}

export function getEnabledAgents(): AgentConfig[] {
  const agents = loadAgentsRegistry();
  return Array.from(agents.values())
    .sort((a, b) => b.priority - a.priority);
}

export function getAgentsByCapability(capability: string): AgentConfig[] {
  const agents = loadAgentsRegistry();
  return Array.from(agents.values())
    .filter(agent => agent.capabilities.includes(capability));
}

export function getAgentsByTrigger(trigger: string): AgentConfig[] {
  const agents = loadAgentsRegistry();
  return Array.from(agents.values())
    .filter(agent => agent.triggers.includes(trigger));
}

// Invalidar cache (útil para hot-reload em dev)
export function reloadRegistry() {
  agentsCache = null;
  return loadAgentsRegistry();
}
```

#### 3. Migrar código existente (2h)
```typescript
// src/hooks/use-autonomous-agents.ts
import { getAgent, getAgentsByTrigger } from '@/lib/agents-registry';

export function useAutonomousAgents() {
  // Substitui array hardcoded por registry dinâmico

  async function processExpediente(expediente: Expediente) {
    // Buscar agentes por trigger
    const agents = getAgentsByTrigger('new_expediente');

    for (const agentConfig of agents) {
      try {
        yield {
          status: 'processing',
          agent: agentConfig.name,
          progress: 0.1
        };

        // Usar config do registry
        const response = await streamGeminiResponse(
          buildPrompt(agentConfig, expediente),
          {
            model: agentConfig.config.model,
            temperature: agentConfig.config.temperature,
            maxTokens: agentConfig.config.maxTokens,
            agentId: agentConfig.id
          }
        );

        // ...processar response
      } catch (error) {
        console.error(`[Agent ${agentConfig.id}]`, error);
      }
    }
  }

  function buildPrompt(agent: AgentConfig, context: any): string {
    return `${agent.config.systemPrompt}

Context:
${JSON.stringify(context, null, 2)}

Analyze and provide recommendations.`;
  }

  return { processExpediente };
}
```

#### 4. Hot-reload em desenvolvimento (30min)
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    watch: {
      // Observar mudanças no registry
      ignored: ['!config/agents-registry.json']
    }
  },
  plugins: [
    {
      name: 'reload-agents-registry',
      handleHotUpdate({ file, server }) {
        if (file.endsWith('agents-registry.json')) {
          console.log('[Hot Reload] Agents registry updated');
          server.ws.send({
            type: 'custom',
            event: 'agents-registry-update'
          });
        }
      }
    }
  ]
});
```

---

## 📊 **Quick Win #3: Agent Telemetry** (4 horas)

### 🎯 Problema Resolvido
- ❌ Atualmente: Logs genéricos, difícil debugar
- ✅ Depois: Traces estruturados, dashboard de performance

### 📁 Arquivos a Criar/Modificar

#### 1. Criar serviço de telemetria (1.5h)
```typescript
// src/lib/agent-telemetry.ts
import { kv } from '@/lib/upstash-kv';

export interface AgentExecution {
  id: string;
  agentId: string;
  agentName: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'success' | 'error';
  inputTokens: number;
  outputTokens: number;
  latency: number;
  context: Record<string, any>;
  error?: string;
  result?: any;
}

export async function startExecution(
  agentId: string,
  context: Record<string, any>
): Promise<AgentExecution> {
  const execution: AgentExecution = {
    id: crypto.randomUUID(),
    agentId,
    agentName: context.agentName || agentId,
    startTime: new Date(),
    status: 'running',
    inputTokens: 0,
    outputTokens: 0,
    latency: 0,
    context
  };

  // Salvar em Redis
  await kv.set(
    `telemetry:${execution.id}`,
    execution,
    { ex: 60 * 60 * 24 * 30 } // 30 dias
  );

  return execution;
}

export async function endExecution(
  executionId: string,
  result: {
    status: 'success' | 'error';
    inputTokens: number;
    outputTokens: number;
    result?: any;
    error?: string;
  }
): Promise<void> {
  const execution = await kv.get<AgentExecution>(`telemetry:${executionId}`);
  if (!execution) return;

  execution.endTime = new Date();
  execution.latency = execution.endTime.getTime() - execution.startTime.getTime();
  execution.status = result.status;
  execution.inputTokens = result.inputTokens;
  execution.outputTokens = result.outputTokens;
  execution.result = result.result;
  execution.error = result.error;

  await kv.set(`telemetry:${executionId}`, execution);

  // Atualizar métricas agregadas
  await updateMetrics(execution);
}

async function updateMetrics(execution: AgentExecution): Promise<void> {
  const date = execution.startTime.toISOString().split('T')[0]; // YYYY-MM-DD
  const key = `metrics:${execution.agentId}:${date}`;

  await kv.hincrby(key, 'total', 1);
  await kv.hincrby(key, execution.status, 1);
  await kv.hincrby(key, 'totalLatency', execution.latency);
  await kv.hincrby(key, 'totalInputTokens', execution.inputTokens);
  await kv.hincrby(key, 'totalOutputTokens', execution.outputTokens);
}

export async function getAgentMetrics(agentId: string, date: string) {
  const key = `metrics:${agentId}:${date}`;
  const metrics = await kv.hgetall(key);

  if (!metrics) return null;

  const total = (metrics.total as number) || 0;
  const success = (metrics.success as number) || 0;
  const totalLatency = (metrics.totalLatency as number) || 0;

  return {
    total,
    success,
    error: (metrics.error as number) || 0,
    successRate: total > 0 ? (success / total) * 100 : 0,
    avgLatency: total > 0 ? totalLatency / total : 0,
    totalInputTokens: (metrics.totalInputTokens as number) || 0,
    totalOutputTokens: (metrics.totalOutputTokens as number) || 0
  };
}
```

#### 2. Wrapper para execução (1h)
```typescript
// src/lib/execute-with-telemetry.ts
import { startExecution, endExecution } from './agent-telemetry';
import { trackLLMCost } from './llm-cost-tracker';

export async function executeAgentWithTelemetry<T>(
  agentId: string,
  context: Record<string, any>,
  fn: () => Promise<T>
): Promise<T> {
  const execution = await startExecution(agentId, context);

  try {
    const result = await fn();

    // Estimar tokens (melhorar com tracking real do Gemini)
    const inputTokens = estimateTokens(JSON.stringify(context));
    const outputTokens = estimateTokens(JSON.stringify(result));

    await endExecution(execution.id, {
      status: 'success',
      inputTokens,
      outputTokens,
      result
    });

    // Registrar custo
    await trackLLMCost({
      provider: 'gemini',
      model: 'gemini-2.5-pro', // Pegar do registry
      agentId,
      inputTokens,
      outputTokens,
      timestamp: new Date(),
      executionId: execution.id
    });

    return result;
  } catch (error) {
    await endExecution(execution.id, {
      status: 'error',
      inputTokens: 0,
      outputTokens: 0,
      error: error.message
    });

    throw error;
  }
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}
```

#### 3. Integrar em agentes existentes (1h)
```typescript
// src/hooks/use-autonomous-agents.ts
import { executeAgentWithTelemetry } from '@/lib/execute-with-telemetry';

async function* analyzeWithHarvey(expediente: Expediente) {
  yield { status: 'analyzing', agent: 'Harvey Specter', progress: 0.1 };

  const result = await executeAgentWithTelemetry(
    'harvey',
    {
      agentName: 'Harvey Specter',
      expedienteId: expediente.id,
      numeroProcesso: expediente.numeroProcesso
    },
    async () => {
      const response = await streamGeminiResponse(prompt, {
        agentId: 'harvey'
      });
      return response;
    }
  );

  yield { status: 'complete', result };
}
```

#### 4. Dashboard de métricas (30min)
```typescript
// src/components/AgentTelemetryDashboard.tsx
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AgentTelemetryDashboard() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  async function fetchMetrics() {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`/api/agent-metrics?date=${today}`);
    const data = await res.json();
    setMetrics(data);
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Execuções (hoje)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics?.total || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Taxa de Sucesso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics?.successRate?.toFixed(1)}%
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Latência Média</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics?.avgLatency?.toFixed(0)}ms
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tokens (total)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {((metrics?.totalInputTokens + metrics?.totalOutputTokens) / 1000).toFixed(1)}K
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🧪 **Validação e Testes** (1 hora extra)

### 1. Testes Unitários
```typescript
// tests/lib/llm-cost-tracker.test.ts
import { describe, it, expect } from 'vitest';
import { trackLLMCost, getMonthlyCosts } from '@/lib/llm-cost-tracker';

describe('LLM Cost Tracker', () => {
  it('should calculate cost correctly', async () => {
    const result = await trackLLMCost({
      provider: 'gemini',
      model: 'gemini-2.5-pro',
      agentId: 'harvey',
      inputTokens: 1000,
      outputTokens: 500,
      timestamp: new Date(),
      executionId: 'test-123'
    });

    // $0.003 por 1K input + $0.0045 por 500 output
    expect(result.cost).toBeCloseTo(0.003 + 0.0045, 6);
  });
});
```

### 2. Testes de Integração
```bash
# Testar API endpoints
npm run test:api

# Validar registry JSON
npm run test:registry-validation
```

---

## 📋 **Checklist de Implementação**

### Quick Win #1: LLM Cost Tracking ✅
- [ ] Criar `src/lib/llm-cost-tracker.ts`
- [ ] Integrar em `src/lib/gemini-service.ts`
- [ ] Criar API `api/llm-costs.ts`
- [ ] Criar componente `LLMCostsDashboard.tsx`
- [ ] Adicionar rota no dashboard
- [ ] Testar com agente Harvey

### Quick Win #2: Agent Registry ✅
- [ ] Criar `config/agents-registry.json`
- [ ] Criar `config/agents-registry.schema.json`
- [ ] Criar `src/lib/agents-registry.ts`
- [ ] Migrar `use-autonomous-agents.ts`
- [ ] Configurar hot-reload no Vite
- [ ] Validar com todos os 16 agentes

### Quick Win #3: Agent Telemetry ✅
- [ ] Criar `src/lib/agent-telemetry.ts`
- [ ] Criar `src/lib/execute-with-telemetry.ts`
- [ ] Integrar em `use-autonomous-agents.ts`
- [ ] Criar API `api/agent-metrics.ts`
- [ ] Criar componente `AgentTelemetryDashboard.tsx`
- [ ] Testar trace completo de execução

---

## 🚀 **Comandos para Iniciar**

```bash
# Instalar dependências (se necessário)
npm install

# Desenvolvimento
npm run dev

# Validar tipos
npm run type-check

# Rodar testes
npm run test:run

# Build production
npm run build
```

---

## 📊 **Métricas de Sucesso**

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Visibilidade de custos | ❌ Nenhuma | ✅ Dashboard completo | ∞ |
| Config de agentes | 🔴 Hardcoded | ✅ JSON dinâmico | +90% flexibilidade |
| Observabilidade | 🟡 Logs genéricos | ✅ Traces estruturados | +80% debugabilidade |
| Tempo para debugar | ~30min | ~5min | -83% |
| Controle de budget | ❌ Nenhum | ✅ Alertas automáticos | ∞ |

---

## 🎯 **Próximos Passos (Opcional)**

Após implementar os 3 Quick Wins, avaliar:

### Fase 2 (8 horas):
- **Checkpointing** para workflows longos

### Fase 3 (16 horas):
- **Approval Gates** (se necessário review humano obrigatório)

---

## 📚 **Referências**

- [COMPARATIVO_MULTI_AGENT_VS_ASSISTENTE.md](./COMPARATIVO_MULTI_AGENT_VS_ASSISTENTE.md)
- [ANALISE_MULTI_AGENT_ENGINE.md](./ANALISE_MULTI_AGENT_ENGINE.md)
- Multi-Agent Engine: `/workspaces/multi-agent-engine/src/backend/v4/`

---

**Última atualização**: 25/12/2024
**Status**: 🟢 Pronto para implementação
**Tempo estimado**: 12-15 horas (incluindo testes)
