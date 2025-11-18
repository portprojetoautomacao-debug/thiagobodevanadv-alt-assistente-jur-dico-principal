import { useState, useEffect } from 'react'
import { useKV } from '@/hooks/use-kv'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { 
  ChartPieSlice,
  Gavel, 
  CalendarCheck, 
  Calculator, 
  ChatCircle,
  Clock,
  Robot,
  FileText,
  CurrencyCircleDollar,
  Books,
  UsersFour,
  Database,
  SignOut,
  ChartBar
} from '@phosphor-icons/react'
import Login from '@/components/Login'
import Dashboard from '@/components/Dashboard'
import DashboardAdvbox from '@/components/DashboardAdvbox'
import ProcessCRMAdvbox from '@/components/ProcessCRMAdvbox'
import OfficeManagement from '@/components/OfficeManagement'
import CadastrarCliente from '@/components/CadastrarCliente'
import ClientesView from '@/components/ClientesView'
import ProcessosView from '@/components/ProcessosView'
import PrazosView from '@/components/PrazosView'
import CalculadoraPrazos from '@/components/CalculadoraPrazos'
import AssistenteIA from '@/components/AssistenteIA'
import AIAgents from '@/components/AIAgents'
import MinutasManager from '@/components/MinutasManager'
import FinancialManagement from '@/components/FinancialManagement'
import FinancialManagementAdvbox from '@/components/FinancialManagementAdvbox'
import KnowledgeBase from '@/components/KnowledgeBase'
import ProcessCRM from '@/components/ProcessCRM'
import DatabaseQueries from '@/components/DatabaseQueries'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import PDFUploader from '@/components/PDFUploader'
import Calendar from '@/components/Calendar'
import KeyboardShortcutsDialog from '@/components/KeyboardShortcutsDialog'
import AIDocumentSummarizer from '@/components/AIDocumentSummarizer'
import AIContractAnalyzer from '@/components/AIContractAnalyzer'
import AILegalResearch from '@/components/AILegalResearch'
import AIEmailDrafter from '@/components/AIEmailDrafter'
import FluentAnimationsShowcase from '@/components/FluentAnimationsShowcase'
import type { ViewType, User } from '@/types'
import { toast } from 'sonner'
import { useAnalytics } from '@/hooks/use-analytics'
import { useNotifications } from '@/hooks/use-notifications'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

function App() {
  const [currentUser, setCurrentUser] = useKV<User | null>('current-user', null)
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const [isLoading, setIsLoading] = useState(true)
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false)
  const { trackPageView, trackAction } = useAnalytics()
  useNotifications() // Initialize notifications (badge count available)

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      description: 'Ir para busca',
      callback: () => {
        if (currentView !== 'processos') {
          setCurrentView('processos')
        }
        // Focus search input after a brief delay
        setTimeout(() => {
          const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
          searchInput?.focus()
        }, 100)
      }
    },
    {
      key: 'n',
      ctrl: true,
      description: 'Novo processo',
      callback: () => {
        setCurrentView('processos')
        toast.info('Use o botão "Novo Processo" para adicionar')
      }
    },
    {
      key: 'd',
      ctrl: true,
      description: 'Dashboard',
      callback: () => {
        setCurrentView('dashboard')
      }
    },
    {
      key: 'p',
      ctrl: true,
      description: 'Processos',
      callback: () => {
        setCurrentView('processos')
      }
    },
    {
      key: 'c',
      ctrl: true,
      shift: true,
      description: 'Calculadora de Prazos',
      callback: () => {
        setCurrentView('calculadora')
      }
    },
    {
      key: '?',
      description: 'Mostrar atalhos',
      callback: () => {
        setShortcutsDialogOpen(true)
      }
    },
  ])

  useEffect(() => {
    setIsLoading(false)
  }, [])

  useEffect(() => {
    trackPageView(currentView)
  }, [currentView])

  const handleLogin = (user: User) => {
    setCurrentUser(() => user)
    trackAction('login', 'authentication', user.role)
  }

  const handleLogout = () => {
    trackAction('logout', 'authentication')
    setCurrentUser(() => null)
    setCurrentView('dashboard')
    toast.success('Logout realizado com sucesso')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <CalendarCheck size={64} className="text-primary neon-glow mx-auto mb-4" weight="duotone" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toaster />
      </>
    )
  }

  const navigation = [
    { id: 'dashboard' as ViewType, label: 'Dashboard', icon: ChartPieSlice },
    { id: 'processos' as ViewType, label: 'Processos', icon: Gavel },
    { id: 'crm' as ViewType, label: 'CRM', icon: Database },
    { id: 'intimacoes' as ViewType, label: 'Intimações', icon: FileText },
    { id: 'agenda' as ViewType, label: 'Agenda', icon: CalendarCheck },
    { id: 'gestao' as ViewType, label: 'Gestão', icon: ChartBar },
    { id: 'financeiro' as ViewType, label: 'Financeiro', icon: CurrencyCircleDollar },
    { id: 'prazos' as ViewType, label: 'Prazos', icon: Clock },
    { id: 'calculadora' as ViewType, label: 'Calculadora', icon: Calculator },
    { id: 'minutas' as ViewType, label: 'Minutas', icon: FileText },
    { id: 'conhecimento' as ViewType, label: 'Conhecimento', icon: Books },
    { id: 'assistente' as ViewType, label: 'Assistente IA', icon: ChatCircle },
    { id: 'agentes' as ViewType, label: 'Agentes IA', icon: Robot },
  ]

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentView} />
      case 'crm':
        return <ProcessCRM />
      case 'gestao':
        return <OfficeManagement />
      case 'intimacoes':
        return <PrazosView />
      case 'agenda':
        return <Calendar />
      case 'fluent-animations':
        return <FluentAnimationsShowcase />
      case 'upload-pdf':
        return <PDFUploader />
      case 'cadastrar-cliente':
        return <CadastrarCliente />
      case 'clientes':
        return <ClientesView />
      case 'processos':
        return <ProcessosView />
      case 'prazos':
        return <PrazosView />
      case 'calculadora':
        return <CalculadoraPrazos />
      case 'minutas':
        return <MinutasManager />
      case 'financeiro':
        return <FinancialManagement />
      case 'consultas':
        return <DatabaseQueries />
      case 'conhecimento':
        return <KnowledgeBase />
      case 'assistente':
        return <AssistenteIA />
      case 'agentes':
        return <AIAgents />
      case 'analytics':
        return <AnalyticsDashboard />
      case 'ai-document-summarizer':
        return <AIDocumentSummarizer />
      case 'ai-contract-analyzer':
        return <AIContractAnalyzer />
      case 'ai-legal-research':
        return <AILegalResearch />
      case 'ai-email-drafter':
        return <AIEmailDrafter />
      default:
        return <Dashboard onNavigate={setCurrentView} />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden lg:flex w-64 border-r border-border/50 flex-col glassmorphic">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-2">
            <CalendarCheck size={32} className="text-primary neon-glow" weight="duotone" />
            <div className="flex flex-col">
              <h1 className="font-bold text-lg leading-none gradient-text">Assistente Jurídico</h1>
              <p className="text-xs text-muted-foreground mt-1">Gestão Processual</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id

            return (
              <Button
                key={item.id}
                variant={isActive ? 'secondary' : 'ghost'}
                className={`justify-start transition-all ${isActive ? 'gradient-border shadow-lg' : ''}`}
                onClick={() => setCurrentView(item.id)}
              >
                <Icon size={20} className={isActive ? 'text-primary neon-glow' : ''} weight={isActive ? 'duotone' : 'regular'} />
                {item.label}
              </Button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border/50 space-y-3">
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-full button-gradient flex items-center justify-center ring-2 ring-primary/30 shadow-lg">
              <span className="text-sm font-semibold text-primary-foreground">
                {currentUser.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{currentUser.role}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start hover:border-destructive/50 hover:text-destructive transition-all"
            onClick={handleLogout}
          >
            <SignOut size={20} />
            Sair
          </Button>
          <div className="text-xs text-muted-foreground text-center pt-2">
            <p>Assistente Jurídico Digital</p>
            <p className="mt-1">v1.0.0</p>
          </div>
        </div>
      </aside>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border/50 glassmorphic z-50 overflow-x-auto">
        <nav className="flex items-center justify-start min-w-max p-2 gap-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id

            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg min-w-[70px] transition-all ${
                  isActive ? 'gradient-border shadow-lg' : 'hover:bg-card/50'
                }`}
              >
                <Icon size={20} weight={isActive ? 'duotone' : 'regular'} className={isActive ? 'text-primary neon-glow' : 'text-muted-foreground'} />
                <span className={`text-xs whitespace-nowrap ${isActive ? 'gradient-text font-semibold' : 'text-muted-foreground'}`}>{item.label.split(' ')[0]}</span>
              </button>
            )
          })}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 p-2 rounded-lg min-w-[70px] text-destructive hover:bg-destructive/10 transition-all"
          >
            <SignOut size={20} />
            <span className="text-xs whitespace-nowrap">Sair</span>
          </button>
        </nav>
      </div>

      <main className="flex-1 overflow-auto pb-20 lg:pb-0">
        {renderView()}
      </main>

      <Toaster />
      <KeyboardShortcutsDialog open={shortcutsDialogOpen} onOpenChange={setShortcutsDialogOpen} />
    </div>
  )
}

export default App
