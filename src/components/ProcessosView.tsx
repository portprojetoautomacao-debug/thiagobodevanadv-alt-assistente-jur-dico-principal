import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import type { Process } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MagnifyingGlass, Plus, Gavel } from '@phosphor-icons/react'
import ProcessDialog from './ProcessDialog'
import ProcessDetailsDialog from './ProcessDetailsDialog'
import DataInitializer from './DataInitializer'

export default function ProcessosView() {
  const [processes, setProcesses] = useKV<Process[]>('processes', [])
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null)

  const filteredProcesses = (processes || []).filter(p => 
    p.titulo.toLowerCase().includes(search.toLowerCase()) ||
    p.numeroCNJ.includes(search) ||
    p.autor.toLowerCase().includes(search.toLowerCase()) ||
    p.reu.toLowerCase().includes(search.toLowerCase())
  )

  const handleEdit = (process: Process) => {
    setSelectedProcess(process)
    setDialogOpen(true)
  }

  const handleView = (process: Process) => {
    setSelectedProcess(process)
    setDetailsOpen(true)
  }

  const handleDelete = (processId: string) => {
    setProcesses(current => (current || []).filter(p => p.id !== processId))
    setDetailsOpen(false)
    setSelectedProcess(null)
  }

  const handleDataGenerated = (generatedProcesses: Process[]) => {
    setProcesses(generatedProcesses)
  }

  if (!processes || processes.length === 0) {
    return <DataInitializer onDataGenerated={handleDataGenerated} />
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Processos</h1>
          <p className="text-sm text-muted-foreground">Gerencie seu acervo processual</p>
        </div>
        <Button onClick={() => {
          setSelectedProcess(null)
          setDialogOpen(true)
        }}>
          <Plus size={20} />
          Novo Processo
        </Button>
      </div>

      <div className="relative">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <Input
          placeholder="Buscar por título, CNJ, autor ou réu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredProcesses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Gavel size={64} className="text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {search ? 'Nenhum processo encontrado' : 'Nenhum processo cadastrado'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              {search 
                ? 'Tente ajustar os termos da busca' 
                : 'Comece adicionando seu primeiro processo jurídico'
              }
            </p>
            {!search && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus size={20} />
                Adicionar Processo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProcesses.map(process => (
            <Card key={process.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleView(process)}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">{process.titulo}</CardTitle>
                  <Badge variant={
                    process.status === 'ativo' ? 'default' :
                    process.status === 'concluido' ? 'secondary' :
                    process.status === 'suspenso' ? 'outline' : 'destructive'
                  }>
                    {process.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground">Número CNJ</p>
                  <p className="text-sm font-mono">{process.numeroCNJ}</p>
                </div>
                
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground">Partes</p>
                  <p className="text-sm">{process.autor} × {process.reu}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-muted-foreground">Comarca</p>
                    <p className="text-sm">{process.comarca}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-muted-foreground">Vara</p>
                    <p className="text-sm">{process.vara}</p>
                  </div>
                </div>

                {process.prazos && process.prazos.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Prazos</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {process.prazos.filter(p => !p.concluido).length} pendentes
                      </Badge>
                      {process.prazos.some(p => p.urgente && !p.concluido) && (
                        <Badge variant="destructive" className="text-xs">Urgente</Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProcessDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        process={selectedProcess}
        onSave={(process) => {
          if (selectedProcess) {
            setProcesses(current => (current || []).map(p => p.id === process.id ? process : p))
          } else {
            setProcesses(current => [...(current || []), process])
          }
          setDialogOpen(false)
          setSelectedProcess(null)
        }}
      />

      <ProcessDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        process={selectedProcess}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}
