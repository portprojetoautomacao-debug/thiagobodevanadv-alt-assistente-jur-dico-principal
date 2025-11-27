import { useState, useMemo } from 'react'
import * as spark from '@github/spark/llm'
import { useProcesses } from '@/hooks/use-processes'
import type { Process } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MagnifyingGlass, Plus, Gavel, DownloadSimple, Funnel, Sparkle } from '@phosphor-icons/react'
import ProcessDialog from '../ProcessDialog'
import ProcessDetailsDialog from '../ProcessDetailsDialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { exportToCSV } from '@/lib/utils'
import { toast } from 'sonner'

export default function ProcessosView() {
  const { processes, addProcess, updateProcess, deleteProcess } = useProcesses()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProcess, setSelectedProcess] = useState<Process | undefined>()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [analyzingProcess, setAnalyzingProcess] = useState<string | null>(null)

  const filteredProcesses = useMemo(() => {
    let results = processes || []

    if (search) {
      const searchLower = search.toLowerCase()
      results = results.filter(p => 
        p.numeroCNJ.toLowerCase().includes(searchLower) ||
        p.titulo.toLowerCase().includes(searchLower) ||
        p.autor.toLowerCase().includes(searchLower) ||
        p.reu.toLowerCase().includes(searchLower) ||
        p.comarca.toLowerCase().includes(searchLower) ||
        p.vara.toLowerCase().includes(searchLower)
      )
    }

    if (statusFilter !== 'all') {
      results = results.filter(p => p.status === statusFilter)
    }

    return results
  }, [processes, search, statusFilter])

  const handleEdit = (process: Process) => {
    setSelectedProcess(process)
    setDialogOpen(true)
  }

  const handleViewDetails = (process: Process) => {
    setSelectedProcess(process)
    setDetailsOpen(true)
  }

  const handleDelete = (processId: string) => {
    deleteProcess(processId)
    setDetailsOpen(false)
    toast.success('Processo excluído com sucesso')
  }

  const handleExportCSV = () => {
    const exportData = filteredProcesses.map(p => ({
      'ID': p.id,
      'Número CNJ': p.numeroCNJ,
      'Título': p.titulo,
      'Autor': p.autor,
      'Réu': p.reu,
      'Comarca': p.comarca,
      'Vara': p.vara,
      'Status': p.status,
      'Valor': p.valor || 0,
      'Data Distribuição': p.dataDistribuicao,
      'Data Última Movimentação': p.dataUltimaMovimentacao,
      'Notas': p.notas || ''
    }))
    exportToCSV(exportData, 'processos')
    toast.success('Processos exportados com sucesso')
  }

  const handleAIAnalysis = async (process: Process) => {
    setAnalyzingProcess(process.id)
    
    try {
      const prompt = `Você é um assistente jurídico especializado. Analise o seguinte processo e forneça insights estratégicos:

Processo: ${process.numeroCNJ}
Título: ${process.titulo}
Autor: ${process.autor}
Réu: ${process.reu}
Status: ${process.status}
Valor: R$ ${process.valor || 0}
Notas: ${process.notas || 'Nenhuma nota disponível'}

Por favor, forneça:
1. Resumo executivo do caso
2. Pontos de atenção principais
3. Riscos identificados
4. Recomendações estratégicas
5. Próximos passos sugeridos

Seja objetivo e prático, focando em insights acionáveis para o advogado.`

      const analysis = await spark.llm(prompt, 'gpt-4o')
      
      const updatedNotes = `${process.notas || ''}\n\n--- ANÁLISE IA (${new Date().toLocaleString('pt-BR')}) ---\n${analysis}`
      
      updateProcess(process.id, { notas: updatedNotes })
      
      toast.success('Análise IA concluída! Verifique as notas do processo.')
    } catch (error) {
      console.error('Erro na análise IA:', error)
      toast.error('Falha ao analisar processo com IA')
    } finally {
      setAnalyzingProcess(null)
    }
  }

  const getStatusBadgeVariant = (status: Process['status']) => {
    switch (status) {
      case 'ativo':
        return 'default'
      case 'suspenso':
        return 'secondary'
      case 'arquivado':
        return 'outline'
      case 'concluido':
        return 'default'
      default:
        return 'default'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gavel size={32} weight="duotone" className="text-primary" />
            Processos
          </h1>
          <p className="text-muted-foreground mt-1">
            {filteredProcesses.length} {filteredProcesses.length === 1 ? 'processo' : 'processos'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline">
            <DownloadSimple size={20} />
            Exportar CSV
          </Button>
          <Button onClick={() => {
            setSelectedProcess(undefined)
            setDialogOpen(true)
          }}>
            <Plus size={20} />
            Novo Processo
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            placeholder="Buscar processos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Funnel size={20} />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="suspenso">Suspenso</SelectItem>
            <SelectItem value="arquivado">Arquivado</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredProcesses.length === 0 ? (
        <Card className="windows-mica">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gavel size={48} className="text-muted-foreground mb-4" weight="duotone" />
            <h3 className="text-lg font-semibold mb-2">
              {search ? 'Nenhum processo encontrado' : 'Nenhum processo cadastrado'}
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              {search 
                ? 'Tente ajustar os filtros ou termo de busca.'
                : 'Adicione seu primeiro processo clicando no botão "Novo Processo" acima.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProcesses.map((process) => (
            <Card key={process.id} className="windows-card cursor-pointer" onClick={() => handleViewDetails(process)}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-2">{process.titulo}</CardTitle>
                  <Badge variant={getStatusBadgeVariant(process.status)} className="shrink-0">
                    {process.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{process.numeroCNJ}</p>
              </CardHeader>
              <CardContent className="space-y-3" onClick={(e) => e.stopPropagation()}>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Partes</p>
                  <p className="text-sm font-medium line-clamp-1">{process.autor} × {process.reu}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Comarca</p>
                    <p className="font-medium line-clamp-1">{process.comarca}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Vara</p>
                    <p className="font-medium line-clamp-1">{process.vara}</p>
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

                <div className="pt-2 border-t flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(process)
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAIAnalysis(process)
                    }}
                    disabled={analyzingProcess === process.id}
                  >
                    <Sparkle size={16} className={analyzingProcess === process.id ? 'animate-spin' : ''} />
                    {analyzingProcess === process.id ? 'Analisando...' : 'Análise IA'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProcessDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        process={selectedProcess || undefined}
        onSave={(process) => {
          if (selectedProcess) {
            updateProcess(selectedProcess.id, process)
            toast.success('Processo atualizado com sucesso')
          } else {
            addProcess(process)
            toast.success('Processo criado com sucesso')
          }
          setDialogOpen(false)
          setSelectedProcess(undefined)
        }}
      />

      <ProcessDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        process={selectedProcess || null}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}
