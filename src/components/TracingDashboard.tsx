import {
  Bot,
  Brain,
  CheckCircle,
  Clock,
  LineChart,
  RefreshCw,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";
/**
 * Tracing Dashboard Component
 *
 * Visualizes distributed tracing data for AI agents and LLM operations.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { tracingService, type Span } from "@/lib/tracing";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

// Helper para obter ícone do status (evita ternário aninhado S3358)
function getStatusIcon(status: string): ReactNode {
  switch (status) {
    case "ok":
      return <CheckCircle className="h-3 w-3" />;
    case "error":
      return <XCircle className="h-3 w-3" />;
    default:
      return <Clock className="h-3 w-3" />;
  }
}

interface TracingDashboardProps {
  agentIds?: string[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface AgentMetric {
  count: number;
  avgDuration: number;
  errors: number;
  lastActive: number;
}

interface LLMMetric {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  estimatedCost: number;
}

interface DashboardMetrics {
  agents: Record<string, AgentMetric>;
  llm: LLMMetric;
  totalSpans: number;
  errorRate: number;
}

export default function TracingDashboard({
  agentIds: _agentIds = [],
  autoRefresh = true,
  refreshInterval = 5000,
}: TracingDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [spans, setSpans] = useState<Span[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(() => {
    setIsRefreshing(true);
    try {
      const allSpans = tracingService.getSpans();
      // Ordenar por data decrescente
      const sortedSpans = [...allSpans].sort((a, b) => b.startTime - a.startTime);
      setSpans(sortedSpans);

      // Calculate metrics locally
      const agentMetrics: Record<string, AgentMetric> = {};
      const llmMetrics: LLMMetric = {
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        estimatedCost: 0,
      };

      let errorCount = 0;

      allSpans.forEach((span) => {
        const duration = span.endTime ? span.endTime - span.startTime : 0;

        if (span.status === "error") {
          errorCount++;
        }

        // Agent Metrics
        const agentId = span.attributes["agent.id"] as string;
        if (agentId) {
          if (!agentMetrics[agentId]) {
            agentMetrics[agentId] = {
              count: 0,
              avgDuration: 0,
              errors: 0,
              lastActive: 0,
            };
          }

          const metric = agentMetrics[agentId];
          const newCount = metric.count + 1;
          metric.avgDuration = (metric.avgDuration * metric.count + duration) / newCount;
          metric.count = newCount;
          if (span.status === "error") metric.errors++;
          if (span.startTime > metric.lastActive) metric.lastActive = span.startTime;
        }

        // LLM Metrics
        if (span.attributes["ai.model"]) {
          const promptTokens = (span.attributes["ai.prompt_tokens"] as number) || 0;
          const completionTokens = (span.attributes["ai.completion_tokens"] as number) || 0;
          const totalTokens = promptTokens + completionTokens;

          llmMetrics.promptTokens += promptTokens;
          llmMetrics.completionTokens += completionTokens;
          llmMetrics.totalTokens += totalTokens;

          // Estimativa simples de custo (ex: /usr/bin/bash.15 / 1M input, /usr/bin/bash.60 / 1M output para gpt-4o-mini)
          // Ajustar conforme necessário
          llmMetrics.estimatedCost += (promptTokens * 0.15 + completionTokens * 0.6) / 1_000_000;
        }
      });

      setMetrics({
        agents: agentMetrics,
        llm: llmMetrics,
        totalSpans: allSpans.length,
        errorRate: allSpans.length > 0 ? (errorCount / allSpans.length) * 100 : 0,
      });
    } catch (error) {
      console.error("Error loading tracing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    if (autoRefresh) {
      const interval = setInterval(loadData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, loadData]);

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center min-h-[200px]">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Carregando métricas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Observabilidade de Agentes</h2>
          <p className="text-muted-foreground">
            Monitoramento em tempo real de performance e custos de LLM
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              tracingService.clear();
              loadData();
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Limpar Dados
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Operações</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSpans}</div>
            <p className="text-xs text-muted-foreground">Registros de execução</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Erro</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {metrics.errorRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Falhas em operações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens Totais</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.llm.totalTokens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Consumo acumulado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Estimado</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.llm.estimatedCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">Baseado em GPT-4o-mini</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="agents">Agentes</TabsTrigger>
          <TabsTrigger value="llm">LLM & Tokens</TabsTrigger>
          <TabsTrigger value="traces">Traces Recentes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4 p-4">
                    {spans.slice(0, 10).map((span, index) => {
                      const duration = span.endTime ? span.endTime - span.startTime : 0;
                      const agentId = span.attributes["agent.id"] as string;

                      return (
                        <div
                          key={`${span.context.spanId}-${span.startTime}-${index}`}
                          className="flex items-center justify-between border-b pb-2 last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            {getStatusIcon(span.status)}
                            <div>
                              <p className="text-sm font-medium">{span.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(span.startTime).toLocaleTimeString()} • {duration}ms
                              </p>
                            </div>
                          </div>
                          <Badge variant={span.status === "error" ? "destructive" : "secondary"}>
                            {agentId || "system"}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Agentes Ativos</CardTitle>
                <CardDescription>Performance por agente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(metrics.agents).map(([agentId, data]) => (
                    <div key={agentId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{agentId}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {data.count} ops • {Math.round(data.avgDuration)}ms avg
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento por Agente</CardTitle>
              <CardDescription>Métricas detalhadas de execução e erros</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {Object.entries(metrics.agents).map(([agentId, data]) => (
                  <div key={agentId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        <h3 className="font-semibold">{agentId}</h3>
                      </div>
                      <Badge variant="outline">{data.count} execuções</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-muted-foreground">Duração Média</p>
                        <p className="font-medium">{Math.round(data.avgDuration)}ms</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-muted-foreground">Erros</p>
                        <p className={`font-medium ${data.errors > 0 ? "text-destructive" : ""}`}>
                          {data.errors}
                        </p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-muted-foreground">Última Execução</p>
                        <p className="font-medium">
                          {new Date(data.lastActive).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="llm">
          <Card>
            <CardHeader>
              <CardTitle>Consumo de LLM</CardTitle>
              <CardDescription>Uso de tokens e custos estimados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Tokens de Entrada</h4>
                    <p className="text-2xl font-bold">
                      {metrics.llm.promptTokens.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Tokens de Saída</h4>
                    <p className="text-2xl font-bold">
                      {metrics.llm.completionTokens.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-4">Operações Recentes de LLM</h4>
                  <div className="space-y-2">
                    {spans
                      .filter((s) => s.attributes["ai.model"])
                      .slice(0, 5)
                      .map((span, index) => {
                        const duration = span.endTime ? span.endTime - span.startTime : 0;
                        const model = span.attributes["ai.model"] as string;
                        const promptTokens = (span.attributes["ai.prompt_tokens"] as number) || 0;
                        const completionTokens =
                          (span.attributes["ai.completion_tokens"] as number) || 0;

                        return (
                          <div
                            key={`${span.context.spanId}-llm-${span.startTime}-${index}`}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Brain className="h-4 w-4 text-primary" />
                              <div>
                                <p className="text-sm font-medium">{span.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {model} • {duration}ms
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {promptTokens + completionTokens} tokens
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(span.startTime).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traces">
          <Card>
            <CardHeader>
              <CardTitle>Traces Completos</CardTitle>
              <CardDescription>Histórico detalhado de todas as operações</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {spans.map((span, index) => {
                    const duration = span.endTime ? span.endTime - span.startTime : 0;
                    const agentId = span.attributes["agent.id"] as string;

                    return (
                      <div
                        key={`${span.context.spanId}-trace-${span.startTime}-${index}`}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(span.status)}
                            <span className="font-medium">{span.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {agentId || "system"}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(span.startTime).toLocaleString()}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Duração:</span> {duration}ms
                          </div>
                          <div>
                            <span className="text-muted-foreground">Trace ID:</span>
                            <span className="font-mono text-xs ml-1">
                              {span.context.traceId.slice(0, 8)}...
                            </span>
                          </div>
                        </div>

                        {Object.keys(span.attributes).length > 0 && (
                          <div className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto">
                            {JSON.stringify(span.attributes, null, 2)}
                          </div>
                        )}

                        {span.status === "error" && span.statusMessage && (
                          <div className="bg-destructive/10 text-destructive p-2 rounded text-sm">
                            {span.statusMessage}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
