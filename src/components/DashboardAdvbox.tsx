import { useMemo, useState } from 'react'
import { useKV } from '@github/spark/hooks'
import type { Process, Prazo, ViewType } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { calcularDiasRestantes, isUrgente, formatarData } from '@/lib/prazos'
import { 
  CheckCircle, 
  Clock, 
  Trophy,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  ArrowUp,
  FileText
} from '@phosphor-icons/react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

interface DashboardAdvboxProps {
  onNavigate: (view: ViewType) => void
}

export default function DashboardAdvbox({ onNavigate }: DashboardAdvboxProps) {
  const [processes] = useKV<Process[]>('processes', [])
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  const stats = useMemo(() => {
    const processesList = processes || []
    
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

    const tarefasFinalizadas = todosPrazos.filter(p => p.concluido).length
    const tarefasPendentes = todosPrazos.filter(p => !p.concluido).length
    const pontosAcumulados = tarefasFinalizadas * 10 // 10 pontos por tarefa

    return {
      tarefasFinalizadas,
      tarefasPendentes,
      pontosAcumulados,
      todosPrazos: todosPrazos.filter(p => !p.concluido).slice(0, 5)
    }
  }, [processes])

  // Performance data for line chart (Meu Desempenho)
  const performanceData = useMemo(() => {
    const processesList = processes || []
    const monthlyStats: { [key: string]: { entradas: number; meta: number; tarefas: number } } = {}
    
    // Generate last 6 months of data
    const months = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' })
      months.push(monthKey)
      monthlyStats[monthKey] = { entradas: 0, meta: 100, tarefas: 0 }
    }

    // Count processes by month
    processesList.forEach(p => {
      const monthKey = new Date(p.createdAt).toLocaleDateString('pt-BR', { month: 'short' })
      if (monthlyStats[monthKey]) {
        monthlyStats[monthKey].entradas += 15 // Simulated value
        monthlyStats[monthKey].tarefas += p.prazos?.length || 0
      }
    })

    return months.map(month => ({
      month,
      'ESTE MÊS': monthlyStats[month].entradas,
      'METAS/OUTROS': monthlyStats[month].meta,
      META: 50
    }))
  }, [processes])

  // Calendar data
  const calendarDays = useMemo(() => {
    const year = selectedMonth.getFullYear()
    const month = selectedMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    return days
  }, [selectedMonth])

  const intimacoes = useMemo(() => {
    const processesList = processes || []
    return processesList.slice(0, 4).map(p => ({
      tipo: 'INTIMAÇÃO JUDICIAL',
      status: p.dataUltimaMovimentacao ? '1 mês atrás' : 'não informado',
      parte1: p.autor,
      parte2: p.reu || 'Não informado',
      numero: p.numeroCNJ,
      atrasado: new Date(p.dataUltimaMovimentacao) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }))
  }, [processes])

  const nextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1))
  }

  const prevMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1))
  }

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-6 h-full overflow-y-auto">
      {/* Header with Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Buscar por nome, cpf, cnj, e-mail, tag ou pasta"
            className="w-full px-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          NOVA TAREFA
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <CheckCircle size={20} weight="fill" className="text-primary" />
                  <span>{stats.tarefasFinalizadas} Tarefas finalizadas</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Clock size={20} weight="fill" className="text-yellow-500" />
                  <span>{stats.tarefasPendentes} Tarefas pendentes</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Trophy size={20} weight="fill" className="text-yellow-500" />
                  <span>{stats.pontosAcumulados} Pontos acumulados</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart - Left Side (2 columns) */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border h-full">
            <CardHeader>
              <CardTitle className="text-base font-medium text-foreground flex items-center justify-between">
                MEU DESEMPENHO
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <ArrowUp size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M2 2h4v4H2V2zm6 0h6v4H8V2zM2 8h4v6H2V8zm6 0h6v6H8V8z" />
                    </svg>
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#6b7280"
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e2130', 
                        border: '1px solid #2a2d3e',
                        borderRadius: '8px',
                        color: '#e8eaed'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ color: '#e8eaed' }}
                      iconType="circle"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ESTE MÊS" 
                      stroke="#52b788" 
                      strokeWidth={2}
                      dot={{ fill: '#52b788', r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="METAS/OUTROS" 
                      stroke="#48cae4" 
                      strokeWidth={2}
                      dot={{ fill: '#48cae4', r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="META" 
                      stroke="#6b7280" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar - Right Side */}
        <div>
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium text-foreground">
                  {selectedMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={prevMonth}>
                    <CaretLeft size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={nextMonth}>
                    <CaretRight size={16} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                  <div key={i} className="text-center text-xs text-muted-foreground font-medium">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`aspect-square flex items-center justify-center text-sm rounded ${
                      day === null
                        ? 'text-transparent'
                        : day === new Date().getDate() && selectedMonth.getMonth() === new Date().getMonth()
                        ? 'bg-primary text-primary-foreground font-bold'
                        : 'text-foreground hover:bg-secondary cursor-pointer'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Intimações/Compromissos List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium text-foreground">
              COMPROMISSOS
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-xs">Tarefa</Button>
              <Button variant="ghost" size="sm" className="text-xs">Pesquisar</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {/* Categories */}
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" className="text-xs h-8">
                <FileText size={14} className="mr-1" />
                Intimações
              </Button>
              <Button variant="ghost" className="text-xs h-8 text-muted-foreground">
                Não lidas
              </Button>
            </div>

            {/* List Items */}
            {intimacoes.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-3 px-3 hover:bg-secondary rounded-lg cursor-pointer group border-b border-border/50 last:border-b-0"
              >
                <div className="flex items-center gap-3 flex-1">
                  <input type="checkbox" className="rounded" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-primary" />
                      <span className="text-sm font-medium">{item.tipo}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.parte1} x {item.parte2}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge 
                    variant={item.atrasado ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {item.status}
                  </Badge>
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xs font-medium">{item.parte1.charAt(0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
