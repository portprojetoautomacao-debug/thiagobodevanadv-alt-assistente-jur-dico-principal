import { useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import type { Process, Prazo, ViewType } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { calcularDiasRestantes, isUrgente, formatarData } from '@/lib/prazos'
import DataInitializer from '@/components/DataInitializer'
import DataManager from '@/components/DataManager'
import { 
  Gavel, 
  CheckCircle, 
  Clock, 
  Warning, 
  CalendarCheck,
  ArrowRight,
  Upload,
  ChartPie,
  TrendUp
} from '@phosphor-icons/react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, Legend } from 'recharts'

interface DashboardProps {
  onNavigate: (view: ViewType) => void
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [processes, setProcesses] = useKV<Process[]>('processes', [])

  const stats = useMemo(() => {
    const processesList = processes || []
    const ativos = processesList.filter(p => p.status === 'ativo').length
    const concluidos = processesList.filter(p => p.status === 'concluido').length
    
    const todosPrazos: (Prazo & { processoTitulo: string })[] = []
    processesList.forEach(process => {
      if (process.prazos && Array.isArray(process.prazos)) {
        process.prazos.forEach(prazo => {
          todosPrazos.push({
            ...prazo,
            processoTitulo: process.titulo
          })
        })
      }
    })

    const prazosPendentes = todosPrazos.filter(p => !p.concluido).length
    const prazosUrgentes = todosPrazos.filter(p => {
      if (p.concluido) return false
      const dias = calcularDiasRestantes(p.dataFinal)
      return isUrgente(dias)
    }).length

    return {
      ativos,
      concluidos,
      prazosPendentes,
      prazosUrgentes,
      todosPrazos: todosPrazos.filter(p => !p.concluido).slice(0, 5)
    }
  }, [processes])

  const prazosProximos = useMemo(() => {
    const todosPrazos: (Prazo & { processoTitulo: string })[] = []
    const processesList = processes || []
    processesList.forEach(process => {
      if (process.prazos && Array.isArray(process.prazos)) {
        process.prazos.forEach(prazo => {
          todosPrazos.push({
            ...prazo,
            processoTitulo: process.titulo
          })
        })
      }
    })

    return todosPrazos
      .filter(p => !p.concluido)
      .sort((a, b) => {
        const diasA = calcularDiasRestantes(a.dataFinal)
        const diasB = calcularDiasRestantes(b.dataFinal)
        return diasA - diasB
      })
      .slice(0, 5)
  }, [processes])

  const processosRecentes = useMemo(() => {
    return [...(processes || [])]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
  }, [processes])

  const chartData = useMemo(() => {
    const processesList = processes || []
    
    const statusData = [
      { name: 'Ativo', value: processesList.filter(p => p.status === 'ativo').length, color: 'oklch(0.75 0.25 190)' },
      { name: 'Concluído', value: processesList.filter(p => p.status === 'concluido').length, color: 'oklch(0.70 0.26 300)' },
      { name: 'Suspenso', value: processesList.filter(p => p.status === 'suspenso').length, color: 'oklch(0.65 0.08 180)' },
      { name: 'Arquivado', value: processesList.filter(p => p.status === 'arquivado').length, color: 'oklch(0.55 0.08 180)' }
    ].filter(item => item.value > 0)

    const varaData: { [key: string]: number } = {}
    processesList.forEach(p => {
      const vara = p.vara || 'Não especificada'
      varaData[vara] = (varaData[vara] || 0) + 1
    })
    const varaChartData = Object.entries(varaData)
      .map(([name, value]) => ({ name: name.length > 25 ? name.substring(0, 25) + '...' : name, value }))
      .slice(0, 5)

    const monthlyData: { [key: string]: { ativos: number; concluidos: number } } = {}
    processesList.forEach(p => {
      const month = new Date(p.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      if (!monthlyData[month]) {
        monthlyData[month] = { ativos: 0, concluidos: 0 }
      }
      if (p.status === 'concluido') {
        monthlyData[month].concluidos++
      } else {
        monthlyData[month].ativos++
      }
    })
    const trendData = Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .slice(-6)

    return { statusData, varaChartData, trendData }
  }, [processes])

  const handleDataGenerated = (generatedProcesses: Process[]) => {
    setProcesses(() => generatedProcesses)
  }

  const handleAddProcesses = (newProcesses: Process[]) => {
    setProcesses(current => [...(current || []), ...newProcesses])
  }

  const handleClearAll = () => {
    setProcesses(() => [])
  }

  if (!processes || processes.length === 0) {
    return <DataInitializer onDataGenerated={handleDataGenerated} />
  }

  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral da sua gestão processual</p>
          </div>
          <DataManager 
            currentProcesses={processes}
            onAddProcesses={handleAddProcesses}
            onClearAll={handleClearAll}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-glow-hover status-gradient-active">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Processos Ativos</CardTitle>
            <Gavel className="text-secondary neon-glow" size={24} weight="duotone" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold gradient-text">{stats.ativos}</div>
            <p className="text-xs text-muted-foreground mt-1">Em andamento</p>
          </CardContent>
        </Card>

        <Card className="card-glow-hover status-gradient-completed">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Processos Concluídos</CardTitle>
            <CheckCircle className="text-accent neon-glow" size={24} weight="duotone" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold gradient-text">{stats.concluidos}</div>
            <p className="text-xs text-muted-foreground mt-1">Finalizados</p>
          </CardContent>
        </Card>

        <Card className="card-glow-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prazos Pendentes</CardTitle>
            <Clock className="text-primary neon-glow" size={24} weight="duotone" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold gradient-text">{stats.prazosPendentes}</div>
            <p className="text-xs text-muted-foreground mt-1">Não concluídos</p>
          </CardContent>
        </Card>

        <Card className={`card-glow-hover ${stats.prazosUrgentes > 0 ? 'status-gradient-urgent border-destructive/50' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prazos Urgentes</CardTitle>
            <Warning className={stats.prazosUrgentes > 0 ? 'text-destructive neon-glow' : 'text-primary'} size={24} weight="duotone" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stats.prazosUrgentes > 0 ? 'text-destructive' : 'gradient-text'}`}>
              {stats.prazosUrgentes}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Próximos 5 dias</p>
          </CardContent>
        </Card>
      </div>

      <Card className="card-glow border-primary/30 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 gradient-text">
            <Upload size={24} weight="duotone" />
            Nova Funcionalidade: Upload de PDF
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Agora você pode fazer upload de procurações e contratos em PDF para extrair automaticamente os dados do cliente usando IA!
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle size={14} weight="fill" />
              Extração automática
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <CheckCircle size={14} weight="fill" />
              Powered by GPT-4
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <CheckCircle size={14} weight="fill" />
              Salva automaticamente
            </Badge>
          </div>
          <Button 
            onClick={() => onNavigate('upload-pdf')} 
            className="button-gradient w-full sm:w-auto"
            size="lg"
          >
            <Upload size={20} />
            Testar Upload de PDF
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card className="card-glow-hover glassmorphic">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 gradient-text">
              <ChartPie size={24} weight="duotone" />
              Processos por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.statusData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ChartPie size={48} className="text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Sem dados para exibir</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData.statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="card-glow-hover glassmorphic">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 gradient-text">
              <Gavel size={24} weight="duotone" />
              Top 5 Varas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.varaChartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Gavel size={48} className="text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Sem dados para exibir</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData.varaChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.06 240 / 0.3)" />
                  <XAxis dataKey="name" stroke="oklch(0.65 0.08 180)" fontSize={12} angle={-15} textAnchor="end" height={80} />
                  <YAxis stroke="oklch(0.65 0.08 180)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'oklch(0.16 0.04 240)', 
                      border: '1px solid oklch(0.25 0.06 240)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" fill="oklch(0.75 0.25 190)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="card-glow-hover glassmorphic lg:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 gradient-text">
              <TrendUp size={24} weight="duotone" />
              Evolução (6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.trendData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <TrendUp size={48} className="text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Sem dados para exibir</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.06 240 / 0.3)" />
                  <XAxis dataKey="month" stroke="oklch(0.65 0.08 180)" fontSize={12} />
                  <YAxis stroke="oklch(0.65 0.08 180)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'oklch(0.16 0.04 240)', 
                      border: '1px solid oklch(0.25 0.06 240)',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="ativos" stroke="oklch(0.75 0.25 190)" strokeWidth={2} name="Ativos" />
                  <Line type="monotone" dataKey="concluidos" stroke="oklch(0.70 0.26 300)" strokeWidth={2} name="Concluídos" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-glow-hover glassmorphic">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="gradient-text">Próximos Prazos</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('prazos')} className="hover:button-gradient hover:text-primary-foreground">
              Ver todos
              <ArrowRight size={16} />
            </Button>
          </CardHeader>
          <CardContent>
            {prazosProximos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarCheck size={48} className="text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum prazo pendente</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {prazosProximos.map(prazo => {
                  const diasRestantes = calcularDiasRestantes(prazo.dataFinal)
                  const urgente = isUrgente(diasRestantes)

                  return (
                    <div key={prazo.id} className={`flex items-start justify-between gap-3 pb-3 border-b last:border-0 p-3 rounded-lg transition-all ${urgente ? 'status-gradient-urgent' : 'hover:bg-card/50'}`}>
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{prazo.descricao}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {prazo.processoTitulo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatarData(prazo.dataFinal)}
                        </p>
                      </div>
                      <Badge variant={urgente ? 'destructive' : 'default'} className={`shrink-0 ${urgente ? 'neon-glow' : ''}`}>
                        {diasRestantes < 0 ? 'Vencido' : 
                         diasRestantes === 0 ? 'Hoje' : 
                         diasRestantes === 1 ? 'Amanhã' :
                         `${diasRestantes} dias`}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-glow-hover glassmorphic">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="gradient-text">Processos Recentes</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('processos')} className="hover:button-gradient hover:text-primary-foreground">
              Ver todos
              <ArrowRight size={16} />
            </Button>
          </CardHeader>
          <CardContent>
            {processosRecentes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Gavel size={48} className="text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum processo cadastrado</p>
                <Button size="sm" className="mt-3 button-gradient" onClick={() => onNavigate('processos')}>
                  Adicionar Processo
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {processosRecentes.map(process => (
                  <div key={process.id} className={`flex items-start justify-between gap-3 pb-3 border-b last:border-0 p-3 rounded-lg transition-all hover:bg-card/50 ${process.status === 'ativo' ? 'status-gradient-active' : ''}`}>
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{process.titulo}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {process.numeroCNJ}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        process.status === 'ativo' ? 'default' :
                        process.status === 'concluido' ? 'secondary' :
                        process.status === 'suspenso' ? 'outline' : 'destructive'
                      } 
                      className="shrink-0"
                    >
                      {process.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {stats.prazosUrgentes > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Warning size={24} />
              Atenção: Prazos Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              Você tem {stats.prazosUrgentes} prazo{stats.prazosUrgentes > 1 ? 's' : ''} vencendo nos próximos 5 dias.
              Certifique-se de tomar as providências necessárias.
            </p>
            <Button variant="destructive" size="sm" onClick={() => onNavigate('prazos')}>
              Ver Prazos Urgentes
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
