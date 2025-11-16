import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Gear, Trash, Sparkle, FileText, CircleNotch } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { generateRealisticProcesses, initializeWithSampleData } from '@/lib/data-initializer'
import type { Process } from '@/types'

interface DataManagerProps {
  currentProcesses: Process[]
  onAddProcesses: (processes: Process[]) => void
  onClearAll: () => void
}

export default function DataManager({ currentProcesses, onAddProcesses, onClearAll }: DataManagerProps) {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState(10)

  const handleLoadSampleData = async () => {
    setLoading(true)
    try {
      const processes = await initializeWithSampleData()
      onAddProcesses(processes)
      toast.success(`${processes.length} processos de exemplo adicionados!`)
      setOpen(false)
    } catch (error) {
      toast.error('Erro ao carregar dados de exemplo')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateData = async () => {
    if (count < 1 || count > 50) {
      toast.error('Por favor, escolha entre 1 e 50 processos')
      return
    }

    setLoading(true)
    try {
      toast.info('Gerando processos com IA...')
      const processes = await generateRealisticProcesses(count)
      
      if (processes.length === 0) {
        toast.error('Nenhum processo foi gerado')
        return
      }

      onAddProcesses(processes)
      toast.success(`${processes.length} processos gerados e adicionados!`)
      setOpen(false)
    } catch (error) {
      toast.error('Erro ao gerar dados. Tente novamente.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleClearAll = () => {
    onClearAll()
    setConfirmOpen(false)
    setOpen(false)
    toast.success('Todos os processos foram removidos')
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <Gear size={20} />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Dados do Sistema</DialogTitle>
            <DialogDescription>
              Adicione mais processos ao sistema ou limpe todos os dados
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium">Processos no sistema</p>
              <p className="text-2xl font-bold mt-1">{currentProcesses.length}</p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Adicionar Processos</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  onClick={handleLoadSampleData}
                  disabled={loading}
                  variant="outline"
                  className="h-auto flex flex-col items-start p-4 gap-2"
                >
                  {loading ? (
                    <CircleNotch className="animate-spin" size={24} />
                  ) : (
                    <FileText size={24} className="text-primary" />
                  )}
                  <div className="text-left">
                    <p className="font-semibold">Dados de Exemplo</p>
                    <p className="text-xs text-muted-foreground">5 processos pré-configurados</p>
                  </div>
                </Button>

                <div className="flex flex-col gap-2 border rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Sparkle size={24} className="text-primary" weight="fill" />
                    <div>
                      <p className="font-semibold text-sm">Gerar com IA</p>
                      <p className="text-xs text-muted-foreground">Processos realistas</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="count-modal" className="text-xs">Quantidade</Label>
                    <Input
                      id="count-modal"
                      type="number"
                      min={1}
                      max={50}
                      value={count}
                      onChange={(e) => setCount(parseInt(e.target.value) || 10)}
                      disabled={loading}
                      className="h-8"
                    />
                  </div>
                  <Button
                    onClick={handleGenerateData}
                    disabled={loading}
                    size="sm"
                  >
                    {loading ? (
                      <>
                        <CircleNotch className="animate-spin" size={16} />
                        Gerando...
                      </>
                    ) : (
                      'Gerar'
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h3 className="font-semibold text-destructive">Zona de Perigo</h3>
              <Button
                onClick={() => setConfirmOpen(true)}
                variant="destructive"
                className="w-full"
              >
                <Trash size={20} />
                Remover Todos os Processos
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os {currentProcesses.length} processos e seus prazos serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll} className="bg-destructive hover:bg-destructive/90">
              Remover Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
