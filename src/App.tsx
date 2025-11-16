import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  LayoutDashboard, 
  Gavel, 
  CalendarCheck, 
  Calculator, 
  ChatCircle,
  Clock 
} from '@phosphor-icons/react'
import Dashboard from '@/components/Dashboard'
import ProcessosView from '@/components/ProcessosView'
import PrazosView from '@/components/PrazosView'
import CalculadoraPrazos from '@/components/CalculadoraPrazos'
import AssistenteIA from '@/components/AssistenteIA'
import type { ViewType, Process } from '@/types'
import { SAMPLE_PROCESSES } from '@/lib/sample-data'

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const [processes, setProcesses] = useKV<Process[]>('processes', [])

  useEffect(() => {
    if (processes.length === 0) {
      setProcesses(SAMPLE_PROCESSES)
    }
  }, [])

  const navigation = [
    { id: 'dashboard' as ViewType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'processos' as ViewType, label: 'Processos', icon: Gavel },
    { id: 'prazos' as ViewType, label: 'Prazos', icon: Clock },
    { id: 'calculadora' as ViewType, label: 'Calculadora', icon: Calculator },
    { id: 'assistente' as ViewType, label: 'Assistente IA', icon: ChatCircle },
  ]

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentView} />
      case 'processos':
        return <ProcessosView />
      case 'prazos':
        return <PrazosView />
      case 'calculadora':
        return <CalculadoraPrazos />
      case 'assistente':
        return <AssistenteIA />
      default:
        return <Dashboard onNavigate={setCurrentView} />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden lg:flex w-64 border-r flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <CalendarCheck size={32} className="text-primary" />
            <div className="flex flex-col">
              <h1 className="font-bold text-lg leading-none">Assistente Jurídico</h1>
              <p className="text-xs text-muted-foreground mt-1">Gestão Processual</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id

            return (
              <Button
                key={item.id}
                variant={isActive ? 'secondary' : 'ghost'}
                className="justify-start"
                onClick={() => setCurrentView(item.id)}
              >
                <Icon size={20} className={isActive ? 'text-primary' : ''} />
                {item.label}
              </Button>
            )
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="text-xs text-muted-foreground text-center">
            <p>Assistente Jurídico Digital</p>
            <p className="mt-1">v1.0.0</p>
          </div>
        </div>
      </aside>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50">
        <nav className="flex items-center justify-around p-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id

            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon size={24} />
                <span className="text-xs">{item.label.split(' ')[0]}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <main className="flex-1 overflow-auto pb-20 lg:pb-0">
        {renderView()}
      </main>

      <Toaster />
    </div>
  )
}

export default App
