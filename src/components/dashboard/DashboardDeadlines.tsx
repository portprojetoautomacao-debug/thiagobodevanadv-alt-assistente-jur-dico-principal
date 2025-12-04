/**
 * Dashboard Deadlines Section
 * Shows upcoming deadlines with urgency indicators
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { calcularDiasRestantes, isUrgente, formatarData } from "@/lib/prazos";
import { CalendarCheck, ArrowRight } from "@phosphor-icons/react";
import type { Prazo, ViewType } from "@/types";

interface DashboardDeadlinesProps {
  prazosProximos: (Prazo & { processoTitulo: string })[];
  onNavigate: (view: ViewType) => void;
}

export function DashboardDeadlines({ prazosProximos, onNavigate }: DashboardDeadlinesProps) {
  return (
    <Card className="bg-linear-to-br from-neutral-2 to-neutral-3 border-neutral-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-accent-9" weight="duotone" />
          <CardTitle className="text-accent-11">Próximos Prazos</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate("prazos")}
          className="text-accent-11 hover:text-accent-12"
        >
          Ver todos
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {prazosProximos.length === 0 ? (
          <p className="text-sm text-neutral-11">Nenhum prazo pendente</p>
        ) : (
          <div className="space-y-3">
            {prazosProximos.map((prazo) => {
              const diasRestantes = calcularDiasRestantes(prazo.dataFinal);
              const urgente = isUrgente(diasRestantes);

              return (
                <div
                  key={prazo.id}
                  className="flex items-start justify-between p-3 rounded-lg bg-neutral-3 border border-neutral-6 hover:border-accent-6 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-12">{prazo.descricao}</p>
                    <p className="text-xs text-neutral-11 mt-1">{prazo.processoTitulo}</p>
                    <p className="text-xs text-neutral-10 mt-1">
                      Vencimento: {formatarData(prazo.dataFinal)}
                    </p>
                  </div>
                  <Badge variant={urgente ? "destructive" : "secondary"} className="ml-2">
                    {diasRestantes === 0
                      ? "Hoje"
                      : diasRestantes === 1
                        ? "1 dia"
                        : `${diasRestantes} dias`}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
