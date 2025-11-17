import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { Users, Clock, CurrencyDollar, TrendUp } from '@phosphor-icons/react'
import type { Process } from '@/types'

interface SafraData {
  ano: number
  fechamentos: number
  emProducao: number
  transitoJulgado: number
  emExecucao: number
  concluidos: number
  ganho: number
  perdido: number
}

const safrasData: SafraData[] = [
  { ano: 2015, fechamentos: 2, emProducao: 2, transitoJulgado: 0, emExecucao: 0, concluidos: 0, ganho: 0, perdido: 0 },
  { ano: 2017, fechamentos: 2, emProducao: 1, transitoJulgado: 1, emExecucao: 1, concluidos: 0, ganho: 0, perdido: 0 },
  { ano: 2018, fechamentos: 5, emProducao: 5, transitoJulgado: 0, emExecucao: 0, concluidos: 0, ganho: 0, perdido: 0 },
  { ano: 2019, fechamentos: 3, emProducao: 3, transitoJulgado: 0, emExecucao: 0, concluidos: 0, ganho: 0, perdido: 0 },
  { ano: 2020, fechamentos: 305, emProducao: 239, transitoJulgado: 66, emExecucao: 64, concluidos: 2, ganho: 1, perdido: 1 },
  { ano: 2021, fechamentos: 330, emProducao: 281, transitoJulgado: 58, emExecucao: 58, concluidos: 0, ganho: 0, perdido: 0 },
]

export default function OfficeManagement() {
  const [activeTab, setActiveTab] = useState('safra')
  const [processes] = useKV<Process[]>('processes', [])

  const produtividadeData = useMemo(() => {
    const processesList = processes || []
    return {
      totalProcessos: processesList.length,
      processosAtivos: processesList.filter(p => p.status === 'ativo').length,
      processosConcluidos: processesList.filter(p => p.status === 'concluido').length,
      taxa: processesList.length > 0 
        ? Math.round((processesList.filter(p => p.status === 'concluido').length / processesList.length) * 100)
        : 0
    }
  }, [processes])

  const estoqueData = useMemo(() => {
    return [
      { name: 'Prospectados', value: 45, color: '#00b4d8' },
      { name: 'Em Negociação', value: 32, color: '#48cae4' },
      { name: 'Convertidos', value: 23, color: '#52b788' },
    ]
  }, [])

  const tempoData = useMemo(() => {
    return [
      { mes: 'Jan', horas: 120, honorarios: 15000 },
      { mes: 'Fev', horas: 135, honorarios: 18000 },
      { mes: 'Mar', horas: 150, honorarios: 20000 },
      { mes: 'Abr', horas: 128, honorarios: 16500 },
      { mes: 'Mai', horas: 145, honorarios: 19000 },
      { mes: 'Jun', horas: 160, honorarios: 22000 },
    ]
  }, [])

  const custosData = useMemo(() => {
    return [
      { categoria: 'Salários', valor: 45000, percentual: 60 },
      { categoria: 'Infraestrutura', valor: 15000, percentual: 20 },
      { categoria: 'Marketing', valor: 7500, percentual: 10 },
      { categoria: 'Outros', valor: 7500, percentual: 10 },
    ]
  }, [])

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão do escritório</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análise de produtividade e qualidade dos processos
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="produtividade">Produtividade</TabsTrigger>
          <TabsTrigger value="estoque">Estoque e Prospecção</TabsTrigger>
          <TabsTrigger value="tempo">Tempo e Honorários</TabsTrigger>
          <TabsTrigger value="custos">Custos</TabsTrigger>
          <TabsTrigger value="safra">Safra e Qualidade</TabsTrigger>
        </TabsList>

        <TabsContent value="produtividade" className="mt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Users size={24} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{produtividadeData.totalProcessos}</p>
                      <p className="text-xs text-muted-foreground">Total de Processos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <TrendUp size={24} className="text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{produtividadeData.processosAtivos}</p>
                      <p className="text-xs text-muted-foreground">Processos Ativos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-accent/10 rounded-lg">
                      <Clock size={24} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{produtividadeData.processosConcluidos}</p>
                      <p className="text-xs text-muted-foreground">Concluídos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-500/10 rounded-lg">
                      <CurrencyDollar size={24} className="text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{produtividadeData.taxa}%</p>
                      <p className="text-xs text-muted-foreground">Taxa de Conclusão</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Produtividade por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tempoData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                      <XAxis dataKey="mes" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e2130',
                          border: '1px solid #2a2d3e',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="horas" fill="#00b4d8" name="Horas Trabalhadas" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="estoque" className="mt-6">
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Funil de Prospecção</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={estoqueData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {estoqueData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e2130',
                          border: '1px solid #2a2d3e',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Detalhamento</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">Percentual</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estoqueData.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">{item.value}</TableCell>
                        <TableCell className="text-right">
                          {Math.round((item.value / estoqueData.reduce((sum, i) => sum + i.value, 0)) * 100)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tempo" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Tempo x Honorários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tempoData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                    <XAxis dataKey="mes" stroke="#6b7280" />
                    <YAxis yAxisId="left" stroke="#6b7280" />
                    <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e2130',
                        border: '1px solid #2a2d3e',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'Honorários (R$)') {
                          return `R$ ${value.toLocaleString('pt-BR')}`
                        }
                        return value
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="horas" fill="#00b4d8" name="Horas" />
                    <Bar yAxisId="right" dataKey="honorarios" fill="#52b788" name="Honorários (R$)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custos" className="mt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Distribuição de Custos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={custosData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentual }) => `${name} ${percentual}%`}
                          outerRadius={80}
                          dataKey="valor"
                        >
                          {custosData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#00b4d8', '#48cae4', '#52b788', '#fbbf24'][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e2130',
                            border: '1px solid #2a2d3e',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Total de Custos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {custosData.map((item) => (
                      <div key={item.categoria} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.categoria}</p>
                          <p className="text-sm text-muted-foreground">{item.percentual}% do total</p>
                        </div>
                        <p className="text-lg font-bold">R$ {item.valor.toLocaleString('pt-BR')}</p>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <p className="font-bold">Total</p>
                        <p className="text-xl font-bold text-primary">
                          R$ {custosData.reduce((sum, item) => sum + item.valor, 0).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="safra" className="mt-6">
          <div className="space-y-6">
            {/* Safras de Processos Table */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Safras de processos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="bg-[#2a5a6f] text-white font-semibold">ANO</TableHead>
                        <TableHead className="bg-[#2a5a6f] text-white font-semibold text-center">FECHAMENTOS</TableHead>
                        <TableHead className="bg-[#2a5a6f] text-white font-semibold text-center">EM PRODUÇÃO</TableHead>
                        <TableHead className="bg-[#2a5a6f] text-white font-semibold text-center">TRÂNSITO JULGADO</TableHead>
                        <TableHead className="bg-[#2a5a6f] text-white font-semibold text-center">EM EXECUÇÃO</TableHead>
                        <TableHead className="bg-[#2a5a6f] text-white font-semibold text-center">CONCLUÍDOS</TableHead>
                        <TableHead className="bg-[#2a5a6f] text-white font-semibold text-center">GANHO (%)</TableHead>
                        <TableHead className="bg-[#2a5a6f] text-white font-semibold text-center">PERDIDO (%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {safrasData.map((safra, index) => (
                        <TableRow 
                          key={safra.ano}
                          className={`border-border ${index % 2 === 0 ? 'bg-[#1a3d4d]' : 'bg-[#1e4555]'} hover:bg-[#234a5c]`}
                        >
                          <TableCell className="font-medium text-white">{safra.ano}</TableCell>
                          <TableCell className="text-center text-white">{safra.fechamentos}</TableCell>
                          <TableCell className="text-center text-white">{safra.emProducao}</TableCell>
                          <TableCell className="text-center text-white">{safra.transitoJulgado}</TableCell>
                          <TableCell className="text-center text-white">{safra.emExecucao}</TableCell>
                          <TableCell className="text-center text-white">{safra.concluidos}</TableCell>
                          <TableCell className="text-center text-white">
                            {safra.ganho > 0 ? `${safra.ganho} (${Math.round((safra.ganho / safra.fechamentos) * 100)}%)` : '0 (0%)'}
                          </TableCell>
                          <TableCell className="text-center text-white">
                            {safra.perdido > 0 ? `${safra.perdido} (${Math.round((safra.perdido / safra.fechamentos) * 100)}%)` : '0 (0%)'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Relatórios Section */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">RELATÓRIOS</CardTitle>
                  <div className="flex items-center gap-2">
                    <select className="px-3 py-1 bg-background border border-border rounded text-sm">
                      <option>Safra</option>
                    </select>
                    <select className="px-3 py-1 bg-background border border-border rounded text-sm">
                      <option>2021</option>
                      <option>2020</option>
                      <option>2019</option>
                    </select>
                    <Button variant="outline" size="sm">
                      + MAIS FILTROS
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead>PARTES</TableHead>
                        <TableHead>TIPO DE AÇÃO</TableHead>
                        <TableHead>ORIGEM DE AÇÃO</TableHead>
                        <TableHead>FASE</TableHead>
                        <TableHead>SITUAÇÃO</TableHead>
                        <TableHead>CARACTERÍSTICA</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-border">
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhum processo encontrado com os filtros selecionados
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
