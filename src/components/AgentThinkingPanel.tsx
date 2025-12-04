/**
 * AgentThinkingPanel - Mostra o "pensamento" dos agentes em tempo real
 * Exibe detalhes específicos do que cada agente está fazendo:
 * - Qual petição está redigindo
 * - Para qual processo
 * - Que prazo está calculando
 * - Progresso de cada etapa
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Gavel,
  Sparkles,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

interface ThinkingLog {
  id: string;
  taskId: string;
  agentId: string;
  agentName: string;
  taskType: string;
  stage: string;
  details: Record<string, string | number | boolean>;
  timestamp: string;
}

interface ActiveTask {
  taskId: string;
  agentId: string;
  agentName: string;
  taskType: string;
  status: string;
  priority?: string;
  data?: Record<string, string | number | boolean>;
  createdAt: string;
  startedAt?: string;
  thinking: ThinkingLog[];
  currentStage: string;
  currentDetails: Record<string, string | number | boolean>;
  thinkingCount: number;
}

interface ThinkingData {
  activeTasks: ActiveTask[];
  recentThinking: ThinkingLog[];
  totalThinking: number;
  timestamp: string;
}

// Ícones para cada tipo de tarefa
const taskIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  DRAFT_PETITION: FileText,
  CALCULATE_DEADLINE: Calendar,
  ANALYZE_DOCUMENT: FileText,
  ANALYZE_INTIMATION: Gavel,
  MONITOR_DJEN: Bot,
  RESEARCH_PRECEDENTS: Brain,
  RISK_ANALYSIS: Sparkles,
  CASE_STRATEGY: Zap,
};

// Labels para cada estágio
const stageLabels: Record<string, string> = {
  INICIANDO: "🚀 Iniciando análise",
  CONTEXTO_RECUPERADO: "📚 Contexto carregado",
  ANALISANDO: "🔍 Analisando",
  RESPOSTA_GERADA: "✍️ Resposta gerada",
  CONCLUÍDO: "✅ Concluído",
};

// Labels para tipos de tarefa
const taskTypeLabels: Record<string, string> = {
  DRAFT_PETITION: "Redigindo petição",
  CALCULATE_DEADLINE: "Calculando prazo",
  ANALYZE_DOCUMENT: "Analisando documento",
  ANALYZE_INTIMATION: "Analisando intimação",
  MONITOR_DJEN: "Monitorando DJEN",
  RESEARCH_PRECEDENTS: "Pesquisando jurisprudência",
  RISK_ANALYSIS: "Análise de risco",
  CASE_STRATEGY: "Estratégia processual",
};

export default function AgentThinkingPanel() {
  const [data, setData] = useState<ThinkingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Polling a cada 3 segundos
  useEffect(() => {
    const fetchThinking = async () => {
      try {
        const response = await fetch("/api/agent-thinking");
        if (!response.ok) {
          throw new Error("Falha ao buscar pensamentos dos agentes");
        }
        const json = await response.json();
        setData(json);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchThinking();
    const interval = setInterval(fetchThinking, 3000); // Atualiza a cada 3s

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pensamento dos Agentes</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pensamento dos Agentes</CardTitle>
          <CardDescription className="text-destructive">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!data || data.activeTasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pensamento dos Agentes</CardTitle>
          <CardDescription>Nenhuma tarefa em processamento no momento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Agentes aguardando próxima tarefa...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500 animate-pulse" />
          Pensamento em Tempo Real
        </CardTitle>
        <CardDescription>
          {data.activeTasks.length}{" "}
          {data.activeTasks.length === 1 ? "agente trabalhando" : "agentes trabalhando"} agora
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            {data.activeTasks.map((task) => {
              const IconComponent = taskIcons[task.taskType] || Bot;
              const taskLabel = taskTypeLabels[task.taskType] || task.taskType;
              const stageLabel = stageLabels[task.currentStage] || task.currentStage;

              return (
                <div
                  key={task.taskId}
                  className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/5"
                >
                  {/* Header da tarefa */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <IconComponent className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-foreground">{task.agentName}</h4>
                        <Badge variant="default" className="text-xs">
                          {taskLabel}
                        </Badge>
                        {task.priority === "high" && (
                          <Badge variant="destructive" className="text-xs">
                            Urgente
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{stageLabel}</p>
                    </div>
                  </div>

                  {/* Detalhes específicos */}
                  <div className="ml-11 space-y-2">
                    {/* Processo */}
                    {task.currentDetails.processo && (
                      <div className="flex items-center gap-2 text-xs">
                        <Gavel className="w-3 h-3 text-muted-foreground" />
                        <span className="font-medium">Processo:</span>
                        <span className="text-muted-foreground">
                          {String(task.currentDetails.processo)}
                        </span>
                      </div>
                    )}

                    {/* Descrição */}
                    {task.currentDetails.descricao && (
                      <div className="flex items-start gap-2 text-xs">
                        <FileText className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-medium">Tarefa:</span>{" "}
                          <span className="text-muted-foreground">
                            {String(task.currentDetails.descricao).substring(0, 100)}
                            {String(task.currentDetails.descricao).length > 100 && "..."}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Preview da resposta */}
                    {task.currentDetails.preview && (
                      <div className="mt-2 p-2 rounded bg-muted/50 border border-border">
                        <p className="text-xs text-muted-foreground">
                          {String(task.currentDetails.preview)}
                        </p>
                      </div>
                    )}

                    {/* Resultado */}
                    {task.currentDetails.resultado && (
                      <div className="flex items-center gap-2 text-xs text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        <span>{String(task.currentDetails.resultado)}</span>
                      </div>
                    )}

                    {/* Tokens e tempo */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      {task.currentDetails.tokensUsados && (
                        <span>📊 {String(task.currentDetails.tokensUsados)} tokens</span>
                      )}
                      {task.currentDetails.tempoProcessamento && (
                        <span>⏱️ {String(task.currentDetails.tempoProcessamento)}</span>
                      )}
                    </div>

                    {/* Timeline de pensamento */}
                    {task.thinking.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-xs font-medium mb-2">Etapas concluídas:</p>
                        <div className="space-y-1">
                          {task.thinking.map((log, idx) => {
                            const isLast = idx === task.thinking.length - 1;
                            return (
                              <div
                                key={log.id}
                                className={`flex items-center gap-2 text-xs ${
                                  isLast ? "text-purple-600 font-medium" : "text-muted-foreground"
                                }`}
                              >
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isLast ? "bg-purple-500" : "bg-muted-foreground/50"
                                  }`}
                                />
                                <span>{stageLabels[log.stage] || log.stage}</span>
                                <span className="text-xs opacity-50">
                                  {new Date(log.timestamp).toLocaleTimeString("pt-BR")}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
