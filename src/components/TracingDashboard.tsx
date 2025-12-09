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
import {
  Bot,
  Brain,
  CheckCircle2,
  Clock,
  LineChart,
  RefreshCw,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

// Helper para obter ícone do status (evita ternário aninhado S3358)
function getStatusIcon(status: string): ReactNode {
  switch (status) {
    case "ok":
      return <CheckCircle2 className="h-3 w-3" />;
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

export default function TracingDashboard({
  agentIds: _agentIds = [],
  autoRefresh = true,
  refreshInterval = 5000,
}: TracingDashboardProps) {
  const [traces, setTraces] = useState<Span[]>([]);
  const [stats, setStats] = useState(tracingService.getStats());

  const refreshData = useCallback(() => {
    setTraces(tracingService.getTraces());
    setStats(tracingService.getStats());
  }, []);

  // Carregamento inicial e auto-refresh
  useEffect(() => {
    // Schedule initial refresh to avoid synchronous setState in effect
    const initialRefreshTimeout = globalThis.setTimeout(refreshData, 0);

    if (autoRefresh) {
      const interval = setInterval(refreshData, refreshInterval);
      return () => {
        globalThis.clearTimeout(initialRefreshTimeout);
        clearInterval(interval);
      };
    }

    return () => {
      globalThis.clearTimeout(initialRefreshTimeout);
    };
  }, [autoRefresh, refreshInterval, refreshData]);

  const handleClearTraces = () => {
    tracingService.clearTraces();
    refreshData();
  };

  if (!stats) {
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
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button variant="destructive" size="sm" onClick={handleClearTraces}>
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
            <div className="text-2xl font-bold">{stats.totalSpans}</div>
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
              {((0 / stats.totalSpans) * 100 || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Falhas em operações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spans Ativos</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSpans}</div>
            <p className="text-xs text-muted-foreground">Em execução</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Amostragem</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.samplingRate * 100).toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Traces capturados</p>
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
                    {traces.slice(0, 10).map((span, index) => {
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
                <CardTitle>Status do Sistema</CardTitle>
                <CardDescription>Estatísticas de tracing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Total de Spans</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stats.totalSpans}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Spans Ativos</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stats.activeSpans}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Tracing Habilitado</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stats.enabled ? 'Sim' : 'Não'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle>Traces Capturados</CardTitle>
              <CardDescription>Lista de todos os traces no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Total de {traces.length} trace{traces.length !== 1 ? 's' : ''} capturado{traces.length !== 1 ? 's' : ''}
                </p>
                {traces.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum trace disponível ainda
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="llm">
          <Card>
            <CardHeader>
              <CardTitle>Exportadores Configurados</CardTitle>
              <CardDescription>Destinos de tracing configurados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm">
                  {stats.exporters.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {stats.exporters.map((exporter, idx) => (
                        <li key={idx}>{exporter}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">Nenhum exportador configurado</p>
                  )}
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
                  {traces.map((span, index) => {
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
