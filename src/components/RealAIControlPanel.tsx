/**
 * Componente de Controle de Modo Real AI
 * Permite alternar entre modo simulado e modo real dos agentes
 */

import { Settings, Zap, ZapOff, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface RealAIControlPanelProps {
  useRealAI: boolean;
  onToggle: () => void;
  tasksProcessed?: number;
  lastProcessedAt?: string;
}

export function RealAIControlPanel({
  useRealAI,
  onToggle,
  tasksProcessed = 0,
  lastProcessedAt,
}: RealAIControlPanelProps) {
  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <CardTitle>Modo de Processamento</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="real-ai-mode" className="text-sm font-medium">
              {useRealAI ? (
                <span className="flex items-center gap-1 text-green-600">
                  <Zap className="h-4 w-4" />
                  IA Real Ativa
                </span>
              ) : (
                <span className="flex items-center gap-1 text-gray-500">
                  <ZapOff className="h-4 w-4" />
                  Modo Simulado
                </span>
              )}
            </Label>
            <Switch
              id="real-ai-mode"
              checked={useRealAI}
              onCheckedChange={onToggle}
            />
          </div>
        </div>
        <CardDescription>
          {useRealAI
            ? 'Agentes usando Spark LLM (GPT-4) e APIs externas'
            : 'Agentes em modo demonstração com dados fictícios'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {useRealAI ? (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <Zap className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900 dark:text-green-100">
              Modo Real Ativo
            </AlertTitle>
            <AlertDescription className="text-green-800 dark:text-green-200">
              <ul className="mt-2 space-y-1 text-sm">
                <li>✓ Processamento com Spark LLM (GPT-4)</li>
                <li>✓ Integração com DJEN e DataJud</li>
                <li>✓ Cálculos reais de prazos com feriados</li>
                <li>✓ Redação de peças com IA avançada</li>
                <li>✓ Análise jurisprudencial real</li>
              </ul>
              
              {tasksProcessed > 0 && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="text-xs font-medium">
                    Tarefas processadas com IA real: {tasksProcessed}
                  </p>
                  {lastProcessedAt && (
                    <p className="text-xs text-green-700 dark:text-green-300">
                      Última execução: {new Date(lastProcessedAt).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Modo Simulado</AlertTitle>
            <AlertDescription>
              <p className="text-sm">
                Os agentes estão gerando dados fictícios para demonstração.
              </p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li>• Atividades simuladas com delays aleatórios</li>
                <li>• Dados gerados localmente no navegador</li>
                <li>• Nenhuma integração com APIs externas</li>
                <li>• Ideal para testes e demonstrações</li>
              </ul>
              
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={onToggle}
              >
                <Zap className="mr-2 h-4 w-4" />
                Ativar Modo Real
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {useRealAI && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3">
            <p className="text-xs text-amber-900 dark:text-amber-100">
              <strong>Observação:</strong> O modo real utiliza recursos de IA que podem
              gerar custos. Os agentes processarão tarefas automaticamente a cada 5 minutos
              via cron jobs da Vercel.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-muted-foreground">
          <div className="rounded border p-2">
            <div className="font-medium text-foreground">Backend</div>
            <div className="mt-1">
              {useRealAI ? '✓ Cron jobs ativos' : '○ Desativados'}
            </div>
          </div>
          <div className="rounded border p-2">
            <div className="font-medium text-foreground">APIs</div>
            <div className="mt-1">
              {useRealAI ? '✓ Integradas' : '○ Simuladas'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
