/**
 * Checkpoint Recovery Modal - Interface para Recuperação de Execuções Falhadas
 *
 * Modal que aparece quando detecta execução incompleta, permitindo ao usuário
 * escolher entre retomar de onde parou ou recomeçar do zero.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Clock, DollarSign, Play, RotateCcw, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface CheckpointSummary {
  agentId: string;
  agentName: string;
  lastStep: number;
  totalSteps: number;
  lastUpdated: Date;
  progress: number;
}

interface CheckpointRecoveryModalProps {
  /** ID da execução com checkpoint pendente */
  executionId: string;
  /** Se o modal está aberto */
  open: boolean;
  /** Callback ao fechar modal */
  onClose: () => void;
  /** Callback ao escolher retomar */
  onResume: () => void;
  /** Callback ao escolher recomeçar */
  onRestart: () => void;
  /** Estimativa de tempo economizado (ms) */
  estimatedTimeSaved?: number;
  /** Estimativa de custo economizado (USD) */
  estimatedCostSaved?: number;
}

export function CheckpointRecoveryModal({
  executionId,
  open,
  onClose,
  onResume,
  onRestart,
  estimatedTimeSaved = 300000, // 5 min padrão
  estimatedCostSaved = 0.08, // $0.08 padrão
}: CheckpointRecoveryModalProps) {
  const [summary, setSummary] = useState<CheckpointSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && executionId) {
      fetchCheckpointSummary();
    }
  }, [open, executionId]);

  async function fetchCheckpointSummary() {
    try {
      setLoading(true);
      const res = await fetch(`/api/checkpoint/${executionId}?action=summary`);

      if (!res.ok) {
        throw new Error("Checkpoint não encontrado");
      }

      const data = await res.json();
      setSummary({
        ...data,
        lastUpdated: new Date(data.lastUpdated),
      });
    } catch (error) {
      console.error("[Recovery] Erro ao buscar checkpoint:", error);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleClearCheckpoint() {
    try {
      await fetch(`/api/checkpoint/${executionId}`, { method: "DELETE" });
      onClose();
    } catch (error) {
      console.error("[Recovery] Erro ao limpar checkpoint:", error);
    }
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return minutes > 0 ? `${minutes}min ${seconds}s` : `${seconds}s`;
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <DialogTitle>Execução Incompleta Detectada</DialogTitle>
          </div>
          <DialogDescription>
            Uma execução anterior foi interrompida. Você pode retomá-la de onde parou ou recomeçar
            do zero.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Carregando informações do checkpoint...
          </div>
        ) : !summary ? (
          <div className="py-8 text-center text-muted-foreground">
            Checkpoint não encontrado ou expirado.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Informações do Agente */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Agente:</span>
                    <Badge variant="outline">{summary.agentName}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Última atualização:</span>
                    <span className="text-sm text-muted-foreground">
                      {summary.lastUpdated.toLocaleString("pt-BR")}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Progresso:</span>
                      <span className="text-muted-foreground">
                        Passo {summary.lastStep} de {summary.totalSteps}
                      </span>
                    </div>
                    <Progress value={summary.progress} className="h-2" />
                    <p className="text-xs text-center text-muted-foreground">
                      {summary.progress.toFixed(0)}% concluído
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefícios de Retomar */}
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="pt-6">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  Benefícios de Retomar
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">
                        ~{formatTime(estimatedTimeSaved)}
                      </p>
                      <p className="text-xs text-green-700">Tempo economizado</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">${estimatedCostSaved.toFixed(2)}</p>
                      <p className="text-xs text-green-700">Custo economizado</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ID da Execução */}
            <div className="text-xs text-muted-foreground">
              <p>ID da execução:</p>
              <code className="block mt-1 bg-muted px-2 py-1 rounded text-[10px]">
                {executionId}
              </code>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClearCheckpoint} className="w-full sm:w-auto">
            Descartar
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              onRestart();
              onClose();
            }}
            disabled={loading || !summary}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Recomeçar do Zero
          </Button>

          <Button
            onClick={() => {
              onResume();
              onClose();
            }}
            disabled={loading || !summary}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
          >
            <Play className="h-4 w-4 mr-2" />
            Retomar de Onde Parou
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook para detectar e gerenciar checkpoints pendentes
 */
export function useCheckpointRecovery(executionId?: string) {
  const [hasCheckpoint, setHasCheckpoint] = useState(false);
  const [checkpointId, setCheckpointId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (executionId) {
      checkForCheckpoint(executionId);
    }
  }, [executionId]);

  async function checkForCheckpoint(id: string) {
    try {
      setLoading(true);
      const res = await fetch(`/api/checkpoint/${id}?action=summary`);

      if (res.ok) {
        setHasCheckpoint(true);
        setCheckpointId(id);
      } else {
        setHasCheckpoint(false);
        setCheckpointId(null);
      }
    } catch (error) {
      console.error("[Checkpoint Hook] Erro ao verificar checkpoint:", error);
      setHasCheckpoint(false);
      setCheckpointId(null);
    } finally {
      setLoading(false);
    }
  }

  async function clearCheckpoint(id: string) {
    try {
      await fetch(`/api/checkpoint/${id}`, { method: "DELETE" });
      setHasCheckpoint(false);
      setCheckpointId(null);
    } catch (error) {
      console.error("[Checkpoint Hook] Erro ao limpar checkpoint:", error);
    }
  }

  return {
    hasCheckpoint,
    checkpointId,
    loading,
    checkForCheckpoint,
    clearCheckpoint,
  };
}
