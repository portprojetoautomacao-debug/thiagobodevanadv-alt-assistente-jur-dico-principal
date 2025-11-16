import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import type { Process, Prazo } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CalendarCheck, Info } from '@phosphor-icons/react'
import { calcularPrazoCPC, calcularPrazoCLT, formatarData, getFeriadosNacionais } from '@/lib/prazos'
import { format } from 'date-fns'
import { toast } from 'sonner'

export default function CalculadoraPrazos() {
  const [processes, setProcesses] = useKV<Process[]>('processes', [])
  const [selectedProcessId, setSelectedProcessId] = useState<string>('')
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0])
  const [diasCorridos, setDiasCorridos] = useState('15')
  const [tipoPrazo, setTipoPrazo] = useState<'cpc' | 'clt'>('cpc')
  const [descricao, setDescricao] = useState('')
  const [resultado, setResultado] = useState<Date | null>(null)

  const handleCalcular = () => {
    const inicio = new Date(dataInicio + 'T00:00:00')
    const dias = parseInt(diasCorridos)

    if (isNaN(dias) || dias <= 0) {
      toast.error('Dias inválidos', { description: 'Informe um número válido de dias' })
      return
    }

    const dataFinal = tipoPrazo === 'cpc' 
      ? calcularPrazoCPC(inicio, dias)
      : calcularPrazoCLT(inicio, dias)

    setResultado(dataFinal)
  }

  const handleSalvarPrazo = () => {
    if (!resultado || !selectedProcessId || !descricao.trim()) {
      toast.error('Campos obrigatórios', { 
        description: 'Selecione um processo, adicione uma descrição e calcule o prazo' 
      })
      return
    }

    const novoPrazo: Prazo = {
      id: `prazo_${Date.now()}`,
      processId: selectedProcessId,
      descricao: descricao.trim(),
      dataInicio: dataInicio,
      diasCorridos: parseInt(diasCorridos),
      tipoPrazo: tipoPrazo,
      dataFinal: format(resultado, 'yyyy-MM-dd'),
      concluido: false,
      urgente: false,
      createdAt: new Date().toISOString()
    }

    setProcesses(current => {
      const processesList = current || []
      const processIndex = processesList.findIndex(p => p.id === selectedProcessId)
      
      if (processIndex === -1) {
        toast.error('Processo não encontrado')
        return processesList
      }

      const updated = [...processesList]
      updated[processIndex] = {
        ...updated[processIndex],
        prazos: [...(updated[processIndex].prazos || []), novoPrazo],
        updatedAt: new Date().toISOString()
      }
      
      return updated
    })

    toast.success('Prazo salvo no processo')
    setDescricao('')
    setResultado(null)
  }

  const feriados = getFeriadosNacionais()

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Calculadora de Prazos</h1>
        <p className="text-muted-foreground">Calcule prazos processuais com precisão</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Calcular Prazo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="dataInicio">Data de Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="diasCorridos">Quantidade de Dias</Label>
              <Input
                id="diasCorridos"
                type="number"
                min="1"
                value={diasCorridos}
                onChange={(e) => setDiasCorridos(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tipoPrazo">Tipo de Prazo</Label>
              <Select value={tipoPrazo} onValueChange={(v) => setTipoPrazo(v as 'cpc' | 'clt')}>
                <SelectTrigger id="tipoPrazo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpc">CPC (apenas dias úteis)</SelectItem>
                  <SelectItem value="clt">CLT (dias corridos)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <Info size={16} />
              <AlertDescription className="text-xs">
                {tipoPrazo === 'cpc' 
                  ? 'Conta apenas dias úteis (exclui sábados, domingos e feriados). Se o prazo final cair em dia não útil, prorroga para o próximo dia útil.'
                  : 'Conta dias corridos a partir da data de início. Se o prazo final cair em dia não útil, prorroga para o próximo dia útil.'
                }
              </AlertDescription>
            </Alert>

            <Button onClick={handleCalcular} className="w-full">
              <CalendarCheck size={20} />
              Calcular Prazo
            </Button>

            {resultado && (
              <div className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/30">
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">Prazo Final</p>
                  <p className="text-2xl font-bold">{formatarData(format(resultado, 'yyyy-MM-dd'))}</p>
                  <p className="text-sm text-muted-foreground">{format(resultado, 'dd/MM/yyyy')}</p>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t">
                  <Label htmlFor="descricao">Descrição do Prazo</Label>
                  <Input
                    id="descricao"
                    placeholder="Ex: Contestação"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                  />

                  <Label htmlFor="processo">Vincular ao Processo</Label>
                  <Select value={selectedProcessId} onValueChange={setSelectedProcessId}>
                    <SelectTrigger id="processo">
                      <SelectValue placeholder="Selecione um processo" />
                    </SelectTrigger>
                    <SelectContent>
                      {(processes || []).filter(p => p.status === 'ativo').map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.titulo} - {p.numeroCNJ}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button onClick={handleSalvarPrazo} variant="secondary" className="w-full">
                    Salvar Prazo no Processo
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feriados Nacionais 2025</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {feriados.map(feriado => (
                <div key={feriado.data} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium">{feriado.nome}</p>
                    <p className="text-xs text-muted-foreground">{formatarData(feriado.data)}</p>
                  </div>
                  <Badge variant="outline">{feriado.tipo}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
