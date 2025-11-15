import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, MagnifyingGlass, Sparkle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import PremonicaoModal from '@/components/PremonicaoModal'
import { generatePremonicaoJuridica } from '@/lib/premonicao-service'
import type { Process, PremonicaoJuridica } from '@/types'

const PROCESS_STAGES = ['Inicial', 'Instrução', 'Sentença', 'Recurso', 'Execução']
const STATUS_COLORS = {
  'aguardando': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'em-andamento': 'bg-blue-100 text-blue-800 border-blue-300',
  'concluido': 'bg-green-100 text-green-800 border-green-300',
  'arquivado': 'bg-gray-100 text-gray-800 border-gray-300',
}

export default function ProcessCRM() {
  const [processes, setProcesses] = useKV<Process[]>('processes', [])
  const [filter, setFilter] = useState('')
  const [selectedStage, setSelectedStage] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [newProcess, setNewProcess] = useState({
    numeroCNJ: '',
    titulo: '',
    autor: '',
    reu: '',
    advogado: '',
    fase: 'Inicial',
  })
  
  const [premonicaoOpen, setPremonicaoOpen] = useState(false)
  const [premonicaoLoading, setPremonicaoLoading] = useState(false)
  const [premonicaoData, setPremonicaoData] = useState<PremonicaoJuridica | null>(null)
  const [premonicaoError, setPremonicaoError] = useState<string | null>(null)

  const filteredProcesses = (processes || []).filter(p => {
    const matchesFilter = filter === '' || 
      p.numeroCNJ.toLowerCase().includes(filter.toLowerCase()) ||
      p.titulo.toLowerCase().includes(filter.toLowerCase()) ||
      p.autor.toLowerCase().includes(filter.toLowerCase())
    
    const matchesStage = !selectedStage || (p as any).fase === selectedStage
    
    return matchesFilter && matchesStage
  })

  const handleAddProcess = () => {
    if (!newProcess.numeroCNJ || !newProcess.titulo) {
      toast.error('CNJ e título são obrigatórios')
      return
    }

    const now = new Date().toISOString()
    const process: Process = {
      id: crypto.randomUUID(),
      numeroCNJ: newProcess.numeroCNJ,
      titulo: newProcess.titulo,
      autor: newProcess.autor,
      reu: newProcess.reu,
      comarca: '',
      vara: '',
      status: 'ativo',
      dataDistribuicao: now.split('T')[0],
      dataUltimaMovimentacao: now,
      prazos: [],
      createdAt: now,
      updatedAt: now,
    }

    setProcesses((current) => [...(current || []), process])
    setShowDialog(false)
    setNewProcess({ numeroCNJ: '', titulo: '', autor: '', reu: '', advogado: '', fase: 'Inicial' })
    toast.success('Processo adicionado com sucesso')
  }

  const handleStatusChange = (processId: string, newStatus: Process['status']) => {
    setProcesses((current) => 
      (current || []).map(p => 
        p.id === processId 
          ? { ...p, status: newStatus, updatedAt: new Date().toISOString() }
          : p
      )
    )
    toast.success('Status atualizado')
  }

  const handlePremonicao = async (process: Process) => {
    setPremonicaoOpen(true)
    setPremonicaoLoading(true)
    setPremonicaoError(null)
    setPremonicaoData(null)

    try {
      const data = await generatePremonicaoJuridica(process.numeroCNJ, process)
      setPremonicaoData(data)
    } catch (error) {
      setPremonicaoError(error instanceof Error ? error.message : 'Erro desconhecido')
      toast.error('Erro ao gerar premonição jurídica')
    } finally {
      setPremonicaoLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Acervo de Processos</h1>
          <p className="text-muted-foreground mt-1">
            Gestão visual CRM do fluxo de processos
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Processo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Processo</DialogTitle>
              <DialogDescription>
                Preencha os dados do processo para adicionar ao acervo
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="cnj">Número CNJ *</Label>
                <Input
                  id="cnj"
                  placeholder="0000000-00.0000.0.00.0000"
                  value={newProcess.cnj}
                  onChange={(e) => setNewProcess({ ...newProcess, cnj: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="title">Título do Processo *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Ação Trabalhista - Horas Extras"
                  value={newProcess.title}
                  onChange={(e) => setNewProcess({ ...newProcess, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plaintiff">Autor</Label>
                <Input
                  id="plaintiff"
                  placeholder="Nome do autor"
                  value={newProcess.plaintiff}
                  onChange={(e) => setNewProcess({ ...newProcess, plaintiff: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defendant">Réu</Label>
                <Input
                  id="defendant"
                  placeholder="Nome do réu"
                  value={newProcess.defendant}
                  onChange={(e) => setNewProcess({ ...newProcess, defendant: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lawyer">Advogado Responsável</Label>
                <Input
                  id="lawyer"
                  placeholder="Nome do advogado"
                  value={newProcess.lawyer}
                  onChange={(e) => setNewProcess({ ...newProcess, lawyer: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stage">Fase Processual</Label>
                <Select value={newProcess.stage} onValueChange={(value) => setNewProcess({ ...newProcess, stage: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROCESS_STAGES.map((stage) => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddProcess}>
                Adicionar Processo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por CNJ, título ou parte..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedStage || 'all'} onValueChange={(value) => setSelectedStage(value === 'all' ? null : value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas as fases" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as fases</SelectItem>
            {PROCESS_STAGES.map((stage) => (
              <SelectItem key={stage} value={stage}>{stage}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProcesses.map((process) => (
          <Card key={process.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base line-clamp-2">{process.title}</CardTitle>
                <Badge className={STATUS_COLORS[process.status]}>
                  {process.status.replace('-', ' ')}
                </Badge>
              </div>
              <CardDescription className="text-xs">{process.cnj}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <p className="text-muted-foreground text-xs mb-1">Autor:</p>
                <p className="font-medium line-clamp-1">{process.parties.plaintiff || '-'}</p>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground text-xs mb-1">Réu:</p>
                <p className="font-medium line-clamp-1">{process.parties.defendant || '-'}</p>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground text-xs mb-1">Fase:</p>
                <Badge variant="outline">{process.stage}</Badge>
              </div>
              <Select value={process.status} onValueChange={(value) => handleStatusChange(process.id, value as Process['status'])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aguardando">Aguardando</SelectItem>
                  <SelectItem value="em-andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="arquivado">Arquivado</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => handlePremonicao(process)}
              >
                <Sparkle className="w-4 h-4" weight="fill" />
                Premonição Jurídica
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProcesses.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plus className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">Nenhum processo encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              {filter || selectedStage ? 'Tente ajustar os filtros' : 'Adicione seu primeiro processo'}
            </p>
          </CardContent>
        </Card>
      )}

      <PremonicaoModal
        isOpen={premonicaoOpen}
        onClose={() => setPremonicaoOpen(false)}
        isLoading={premonicaoLoading}
        data={premonicaoData}
        error={premonicaoError}
      />
    </div>
  )
}
