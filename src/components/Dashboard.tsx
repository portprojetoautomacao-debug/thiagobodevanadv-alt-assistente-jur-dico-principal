import { useMemo } from 'react'
import type { Process, Prazo, ViewType } fr
import type { Process, Prazo, ViewType } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Gavel, CalendarCheck, Clock, CheckCi
import { Button } from '@/components/ui/button'
import { Gavel, CalendarCheck, Clock, CheckCircle, ArrowRight } from '@phosphor-icons/react'
import { calcularDiasRestantes, isUrgente, formatarData } from '@/lib/prazos'

interface DashboardProps {

}

export default function Dashboard({ onNavigate }: DashboardProps) {
    const prazosPendentes = todosPrazos.filter(p => !p.

  const stats = useMemo(() => {
    const ativos = processes.filter(p => p.status === 'ativo').length
        process.prazos.forEach(prazo => {
    
              processoTitulo: process.titulo,
            })
        })
    })
    return todosPrazos
      .slice(0, 5)


      .slice(0, 5)


        <h1 className="text-3xl md:text-
      </div>
    
          <CardHeader className="f
            <Gavel className="text-primary" size={20} />
          <CardContent>
            <p className="text-xs
        </Card>
        <Card className
            <CardTitle className="text-sm fon
          </CardHeader>
            <d
          <

       
      

            <p classNa
        </Card>
        <Card clas
            <Card

            <div className="text-3xl font-b
          </CardContent>
      </div>
      <div classNa
          <CardHe

          
          </CardHeader>
            {prazosProximos.length === 0 ? 
                <CalendarCheck size={48} className="text-muted-foreground mb-2" />
              </div>
            


                    <div key={prazo.id} className="flex items-start justify-between gap-3 pb-3 border-b last:border
                        <p className="font-medium text-sm truncate">{prazo.descric
                          {prazo.processoTitulo}
                        <p className="text-xs text-muted
                       
                      <
                         diasRestantes === 0 ? 'Hoje' : 
                         `${diasRestantes} dias`}
                    </di
               

        </Card>
        <Card>
            <CardTitle>Processos Recentes</CardTitle>
              Ver todos
            </Button>
          <CardContent>
              <div className="flex flex-col items-center justify-center py-8 
                <p className="text-sm text-muted-foreground">Nenhum processo cadastrado<
                  Adicio
              <

                  <div key={process.id} className="flex items-start justify-between gap-3 pb-3 border-b last:bor
                      <p className="font-medium text-sm truncate">{process.titulo}
                      <p className="text-xs text-muted-foreground">
                      </p>
                    <Ba
                      p
                    } className="shrink-0">
                    </Badge>
                ))}
            )}


        <Card className="border-destructive bg-destructive/5">
            <CardTitle className="flex items-center gap-2 text-destructive">
              Atenção: Prazos Urgentes
          </CardHeader>
            <p classNam
              Certifique-se de tomar as providências necessárias.
            <Button variant="destructive" size="sm" onClick={() => onNavigate('prazos')
            </Button>
        </Card>
    </div>
















































































































