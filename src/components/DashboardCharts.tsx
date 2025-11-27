import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  LineChart, 
  Line, 
  CartesianGrid, 
  Legend 
} from 'recharts'
import { ChartPie, Gavel, TrendUp } from '@phosphor-icons/react'

interface ChartData {
  statusData: Array<{ name: string; value: number; color: string }>
  varaChartData: Array<{ name: string; value: number }>
  trendData: Array<{ month: string; ativos: number; concluidos: number }>
}

interface DashboardChartsProps {
  chartData: ChartData
}

export function StatusChart({ chartData }: DashboardChartsProps) {
  try {
    if (!chartData?.statusData || chartData.statusData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ChartPie size={48} className="text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Sem dados para exibir</p>
        </div>
      )
    }

    return (
      <ResponsiveContainer width="99%" height={250}>
        <PieChart>
          <Pie
            data={chartData.statusData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
          >
            {chartData.statusData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    )
  } catch (error) {
    console.error('Error rendering StatusChart:', error)
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ChartPie size={48} className="text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Erro ao carregar gráfico</p>
      </div>
    )
  }
}

export function VaraChart({ chartData }: DashboardChartsProps) {
  try {
    if (!chartData?.varaChartData || chartData.varaChartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Gavel size={48} className="text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Sem dados para exibir</p>
        </div>
      )
    }

    return (
      <ResponsiveContainer width="99%" height={250}>
        <BarChart data={chartData.varaChartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.06 240 / 0.3)" />
          <XAxis dataKey="name" stroke="oklch(0.65 0.08 180)" fontSize={12} />
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
    )
  } catch (error) {
    console.error('Error rendering VaraChart:', error)
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Gavel size={48} className="text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Erro ao carregar gráfico</p>
      </div>
    )
  }
}

export function TrendChart({ chartData }: DashboardChartsProps) {
  try {
    if (!chartData?.trendData || chartData.trendData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <TrendUp size={48} className="text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Sem dados para exibir</p>
        </div>
      )
    }

    return (
      <ResponsiveContainer width="99%" height={250}>
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
    )
  } catch (error) {
    console.error('Error rendering TrendChart:', error)
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <TrendUp size={48} className="text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Erro ao carregar gráfico</p>
      </div>
    )
  }
}
