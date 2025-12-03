/**
 * Tracing Dashboard Component
 *
 * Visualizes distributed tracing data for AI agents and LLM operations.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAgentMetrics, getLLMMetrics } from "@/lib/agent-tracing";
import { tracingService, type Span } from "@/lib/tracing";
import {
  ArrowRight,
  ArrowsClockwise,
  Brain,
  ChartLine,
  CheckCircle,
  Clock,
  Pulse,
  Robot,
  Trash,
  XCircle,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";

interface TracingDashboardProps {
  agentIds?: string[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function TracingDashboard({
  agentIds = [],
  autoRefresh = true,
  refreshInterval = 5000,
}: TracingDashboardProps) {
  const [traces, setTraces] = useState<Span[]>([]);
  const [stats, setStats] = useState(tracingService.getStats());
  const [selectedTrace, setSelectedTrace] = useState<string | null>(null);
  const [agentMetrics, setAgentMetrics] = useState<
    Record<string, ReturnType<typeof getAgentMetrics>>
  >({});
  const [llmMetrics, setLLMMetrics] = useState<ReturnType<
    typeof getLLMMetrics
  > | null>(null);

  const refreshData = useCallback(() => {
    setTraces(tracingService.getTraces());
    setStats(tracingService.getStats());
    setLLMMetrics(getLLMMetrics());

    const metrics: Record<string, ReturnType<typeof getAgentMetrics>> = {};
    agentIds.forEach((id) => {
      metrics[id] = getAgentMetrics(id);
    });
    setAgentMetrics(metrics);
  }, [agentIds]);

  // Carregamento inicial e auto-refresh
  useEffect(() => {
    // Usar um timeout para evitar chamada direta durante render
    const initialTimeout = setTimeout(refreshData, 0);

    if (autoRefresh) {
      const interval = setInterval(refreshData, refreshInterval);
      return () => {
        clearTimeout(initialTimeout);
        clearInterval(interval);
      };
    }
    
    return () => clearTimeout(initialTimeout);
  }, [autoRefresh, refreshInterval, refreshData]);

  const handleClearTraces = () => {
    tracingService.clearTraces();
    refreshData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok":
        return "text-green-600 bg-green-100";
      case "error":
        return "text-red-600 bg-red-100";
      default:
        return "text-yellow-600 bg-yellow-100";
    }
  };

  const getKindIcon = (kind: string) => {
    switch (kind) {
      case "client":
        return <ArrowRight className="h-4 w-4" />;
      case "server":
        return <Pulse className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDuration = (startTime: number, endTime?: number) => {
    if (!endTime) return "Em progresso...";
    const duration = endTime - startTime;
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const selectedSpans = selectedTrace
    ? tracingService.getTraceById(selectedTrace)
    : [];

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Spans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSpans}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeSpans} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Amostragem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.samplingRate * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.enabled ? "Tracing ativo" : "Tracing desativado"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chamadas LLM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {llmMetrics?.totalCalls || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {llmMetrics?.totalTokens.toLocaleString() || 0} tokens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tempo Médio LLM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {llmMetrics?.avgResponseTime
                ? `${(llmMetrics.avgResponseTime / 1000).toFixed(2)}s`
                : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {llmMetrics?.errorRate.toFixed(1)}% taxa de erro
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={refreshData}>
          <ArrowsClockwise className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
        <Button variant="outline" size="sm" onClick={handleClearTraces}>
          <Trash className="h-4 w-4 mr-2" />
          Limpar Traces
        </Button>
      </div>

      <Tabs defaultValue="traces">
        <TabsList>
          <TabsTrigger value="traces">
            <Pulse className="h-4 w-4 mr-2" />
            Traces
          </TabsTrigger>
          <TabsTrigger value="agents">
            <Robot className="h-4 w-4 mr-2" />
            Agentes
          </TabsTrigger>
          <TabsTrigger value="llm">
            <Brain className="h-4 w-4 mr-2" />
            LLM
          </TabsTrigger>
        </TabsList>

        {/* Traces Tab */}
        <TabsContent value="traces" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Traces List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Traces Recentes</CardTitle>
                <CardDescription>
                  Últimos {traces.length} spans registrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {traces
                      .slice(-50)
                      .reverse()
                      .map((span) => (
                        <button
                          type="button"
                          key={`${span.context.traceId}-${span.context.spanId}`}
                          className={`w-full text-left p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedTrace === span.context.traceId
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => setSelectedTrace(span.context.traceId)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getKindIcon(span.kind)}
                              <span className="font-medium text-sm">
                                {span.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {formatDuration(span.startTime, span.endTime)}
                              </span>
                              <Badge
                                variant="secondary"
                                className={getStatusColor(span.status)}
                              >
                                {span.status === "ok" ? (
                                  <CheckCircle className="h-3 w-3" />
                                ) : span.status === "error" ? (
                                  <XCircle className="h-3 w-3" />
                                ) : (
                                  <Clock className="h-3 w-3" />
                                )}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(span.startTime).toLocaleString("pt-BR")}
                          </p>
                        </button>
                      ))}
                    {traces.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum trace registrado ainda
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Trace Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalhes do Trace</CardTitle>
                <CardDescription>
                  {selectedTrace
                    ? `${selectedSpans.length} spans no trace`
                    : "Selecione um trace para ver detalhes"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {selectedSpans.length > 0 ? (
                    <div className="space-y-4">
                      {selectedSpans.map((span, index) => (
                        <div
                          key={span.context.spanId}
                          className="border rounded-lg p-3"
                          style={{ marginLeft: `${index * 16}px` }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{span.name}</span>
                            <Badge
                              variant="secondary"
                              className={getStatusColor(span.status)}
                            >
                              {span.status}
                            </Badge>
                          </div>

                          {/* Attributes */}
                          {Object.keys(span.attributes).length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs font-medium mb-1">
                                Atributos:
                              </p>
                              <div className="grid grid-cols-2 gap-1">
                                {Object.entries(span.attributes).map(
                                  ([key, value]) => (
                                    <div
                                      key={key}
                                      className="text-xs bg-muted/50 rounded px-2 py-1"
                                    >
                                      <span className="text-muted-foreground">
                                        {key}:{" "}
                                      </span>
                                      <span>
                                        {String(value).substring(0, 50)}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {/* Events */}
                          {span.events.length > 0 && (
                            <div>
                              <p className="text-xs font-medium mb-1">
                                Eventos:
                              </p>
                              <div className="space-y-1">
                                {span.events.map((event, i) => (
                                  <div
                                    key={`${span.context.spanId}-${event.name}-${i}`}
                                    className="text-xs bg-blue-50 dark:bg-blue-950 rounded px-2 py-1"
                                  >
                                    {event.name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {span.statusMessage && (
                            <p className="text-xs text-red-600 mt-2">
                              {span.statusMessage}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Selecione um trace à esquerda
                    </p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(agentMetrics).map(([agentId, metrics]) => (
              <Card key={agentId}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Robot className="h-5 w-5" />
                    {agentId}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Execuções</p>
                      <p className="font-medium">{metrics.totalExecutions}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Taxa de Sucesso</p>
                      <p className="font-medium">
                        {metrics.successRate.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duração Média</p>
                      <p className="font-medium">
                        {(metrics.avgDuration / 1000).toFixed(2)}s
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ferramentas</p>
                      <p className="font-medium">
                        {Object.keys(metrics.toolUsage).length}
                      </p>
                    </div>
                  </div>

                  {Object.keys(metrics.toolUsage).length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Ferramentas mais usadas:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(metrics.toolUsage)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 5)
                          .map(([tool, count]) => (
                            <Badge
                              key={tool}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tool}: {count}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}

                  {metrics.recentErrors.length > 0 && (
                    <div>
                      <p className="text-xs text-red-600 mb-1">
                        Erros recentes:
                      </p>
                      {metrics.recentErrors.slice(0, 2).map((error, i) => (
                        <p
                          key={i}
                          className="text-xs text-muted-foreground truncate"
                        >
                          {error}
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {Object.keys(agentMetrics).length === 0 && (
              <Card className="col-span-full">
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">
                    Nenhum agente configurado para monitoramento
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* LLM Tab */}
        <TabsContent value="llm" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Métricas LLM
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {llmMetrics ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded-lg p-3">
                        <p className="text-sm text-muted-foreground">
                          Total de Chamadas
                        </p>
                        <p className="text-2xl font-bold">
                          {llmMetrics.totalCalls}
                        </p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <p className="text-sm text-muted-foreground">
                          Total de Tokens
                        </p>
                        <p className="text-2xl font-bold">
                          {llmMetrics.totalTokens.toLocaleString()}
                        </p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <p className="text-sm text-muted-foreground">
                          Tempo Médio
                        </p>
                        <p className="text-2xl font-bold">
                          {llmMetrics.avgResponseTime > 0
                            ? `${(llmMetrics.avgResponseTime / 1000).toFixed(
                                2
                              )}s`
                            : "-"}
                        </p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <p className="text-sm text-muted-foreground">
                          Taxa de Erro
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          {llmMetrics.errorRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {Object.keys(llmMetrics.tokensByModel).length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">
                          Tokens por Modelo:
                        </p>
                        <div className="space-y-2">
                          {Object.entries(llmMetrics.tokensByModel).map(
                            ([model, tokens]) => (
                              <div
                                key={model}
                                className="flex items-center justify-between border rounded px-3 py-2"
                              >
                                <span className="text-sm">{model}</span>
                                <span className="font-medium">
                                  {tokens.toLocaleString()}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma métrica LLM disponível
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ChartLine className="h-5 w-5" />
                  Configuração de Tracing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Status</span>
                    <Badge variant={stats.enabled ? "default" : "secondary"}>
                      {stats.enabled ? "Ativo" : "Desativado"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Taxa de Amostragem</span>
                    <span className="font-medium">
                      {(stats.samplingRate * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Spans Ativos</span>
                    <span className="font-medium">{stats.activeSpans}</span>
                  </div>

                  <div>
                    <p className="text-sm mb-2">Exporters:</p>
                    <div className="flex flex-wrap gap-1">
                      {stats.exporters.map((exporter) => (
                        <Badge key={exporter} variant="outline">
                          {exporter}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
