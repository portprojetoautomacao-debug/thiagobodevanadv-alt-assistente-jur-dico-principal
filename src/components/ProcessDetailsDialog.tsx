import { useState } from 'react'
import type { Process } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Pencil, Trash, CalendarCheck } from '@phosphor-icons/react'
import { formatarData, calcularDiasRestantes, isUrgente, formatarMoeda } from '@/lib/prazos'
import { toast } from 'sonner'

interface ProcessDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  process: Process | null
  onEdit: (process: Process) => void
  onDelete: (id: string) => void
}

export default function ProcessDetailsDialog({ open, onOpenChange, process, onEdit, onDelete }: ProcessDetailsDialogProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  if (!process) return null

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    onDelete(process.id)
    setDeleteDialogOpen(false)
    toast.success('Processo excluído')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="flex-1">{process.titulo}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => {
                onEdit(process)
                onOpenChange(false)
              }}>
                <Pencil size={16} />
                Editar
              </Button>
              <Button size="sm" variant="destructive" onClick={handleDeleteClick}>
                <Trash size={16} />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Badge variant={
              process.status === 'ativo' ? 'default' :
              process.status === 'concluido' ? 'secondary' :
              process.status === 'suspenso' ? 'outline' : 'destructive'
            }>
              {process.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Número CNJ</p>
              <p className="font-mono text-sm">{process.numeroCNJ}</p>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Data de Distribuição</p>
              <p className="text-sm">{formatarData(process.dataDistribuicao)}</p>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Autor</p>
              <p className="text-sm">{process.autor}</p>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Réu</p>
              <p className="text-sm">{process.reu}</p>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Comarca</p>
              <p className="text-sm">{process.comarca}</p>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Vara</p>
              <p className="text-sm">{process.vara}</p>
            </div>

            {process.valor && (
              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">Valor da Causa</p>
                <p className="text-sm font-semibold">
                  {formatarMoeda(process.valor)}
                </p>
              </div>
            )}
          </div>

          {process.notas && (
            <>
              <Separator />
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold">Observações</p>
                <p className="text-sm whitespace-pre-wrap">{process.notas}</p>
              </div>
            </>
          )}

          {process.prazos && process.prazos.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <CalendarCheck size={20} className="text-primary" />
                  <p className="text-sm font-semibold">Prazos ({process.prazos.length})</p>
                </div>
                
                <div className="flex flex-col gap-2">
                  {process.prazos.map(prazo => {
                    const diasRestantes = calcularDiasRestantes(prazo.dataFinal)
                    const urgente = isUrgente(diasRestantes) && !prazo.concluido

                    return (
                      <div key={prazo.id} className="flex items-start justify-between gap-3 p-3 border rounded-lg">
                        <div className="flex flex-col gap-1 flex-1">
                          <p className="font-medium text-sm">{prazo.descricao}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>Início: {formatarData(prazo.dataInicio)}</span>
                            <span>•</span>
                            <span>Final: {formatarData(prazo.dataFinal)}</span>
                            <span>•</span>
                            <span>{prazo.diasCorridos} dias ({prazo.tipoPrazo.toUpperCase()})</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {prazo.concluido ? (
                            <Badge variant="secondary">Concluído</Badge>
                          ) : (
                            <>
                              <Badge variant={urgente ? 'destructive' : 'default'}>
                                {diasRestantes < 0 ? 'Vencido' : 
                                 diasRestantes === 0 ? 'Hoje' : 
                                 diasRestantes === 1 ? 'Amanhã' : 
                                 `${diasRestantes}d`}
                              </Badge>
                              {urgente && <Badge variant="outline" className="text-xs">Urgente</Badge>}
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir processo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este processo? Esta ação não pode ser desfeita e todos os prazos associados serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
