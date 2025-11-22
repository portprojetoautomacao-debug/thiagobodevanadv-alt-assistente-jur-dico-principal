import { useState, useEffect, lazy, Suspense } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { GoogleAuthButton } from '@/components/GoogleAuth'
import type { GoogleUser } from '@/components/GoogleAuth'
import Sidebar from '@/components/Sidebar'
import { useKV } from '@/hooks/use-kv'
import type { ViewType, User } from '@/types'

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  </div>
)

// ✅ Code Splitting: Componentes carregados apenas quando necessários
// Dashboard carregado imediatamente (é a tela inicial)
import Dashboard from '@/components/Dashboard'

// Outros componentes carregados sob demanda (lazy loading)
const ProcessCRM = lazy(() => import('@/components/ProcessCRM'))
const Calendar = lazy(() => import('@/components/Calendar'))
const FinancialManagement = lazy(() => import('@/components/FinancialManagement'))
const CalculadoraPrazos = lazy(() => import('@/components/CalculadoraPrazos'))
const PDFUploader = lazy(() => import('@/components/PDFUploader'))
const MinutasManager = lazy(() => import('@/components/MinutasManager'))
const Donna = lazy(() => import('@/components/Donna'))
const AIAgents = lazy(() => import('@/components/AIAgents'))
const AnalyticsDashboard = lazy(() => import('@/components/AnalyticsDashboard'))
const ExpedientePanel = lazy(() => import('@/components/ExpedientePanel'))
const BatchAnalysis = lazy(() => import('@/components/BatchAnalysis'))
const AudioTranscription = lazy(() => import('@/components/AudioTranscription'))
const DatabaseQueries = lazy(() => import('@/components/DatabaseQueries'))
const DatajudChecklist = lazy(() => import('@/components/DatajudChecklist'))
const KnowledgeBase = lazy(() => import('@/components/KnowledgeBase'))

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const [user, setUser] = useKV<User | null>('user', null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setIsAuthenticated(!!user)
  }, [user])

  const handleAuthSuccess = (googleUser: GoogleUser) => {
    const user: User = {
      ...googleUser,
      role: googleUser.role || 'advogado' // Valor padrão para advogados
    }
    setUser(user)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setUser(null)
    setIsAuthenticated(false)
    setCurrentView('dashboard')
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentView} />
      case 'crm':
      case 'processos':
      case 'processes':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ProcessCRM />
          </Suspense>
        )
      case 'calendar':
      case 'calendario':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Calendar />
          </Suspense>
        )
      case 'financeiro':
      case 'financial':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <FinancialManagement />
          </Suspense>
        )
      case 'prazos':
      case 'calculadora':
      case 'calculator':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <CalculadoraPrazos />
          </Suspense>
        )
      case 'upload-pdf':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <PDFUploader />
          </Suspense>
        )
      case 'minutas':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <MinutasManager />
          </Suspense>
        )
      case 'donna':
      case 'assistente':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Donna />
          </Suspense>
        )
      case 'ai-agents':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AIAgents onNavigate={setCurrentView} />
          </Suspense>
        )
      case 'analytics':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AnalyticsDashboard />
          </Suspense>
        )
      case 'expedientes':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ExpedientePanel />
          </Suspense>
        )
      case 'batch':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <BatchAnalysis />
          </Suspense>
        )
      case 'audio':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AudioTranscription />
          </Suspense>
        )
      case 'queries':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <DatabaseQueries />
          </Suspense>
        )
      case 'datajud':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <DatajudChecklist />
          </Suspense>
        )
      case 'knowledge':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <KnowledgeBase />
          </Suspense>
        )
      default:
        return <Dashboard onNavigate={setCurrentView} />
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 notranslate" translate="no">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Assistente Jurídico PJe
            </h1>
            <p className="text-muted-foreground">
              Sistema inteligente de gestão jurídica com IA
            </p>
          </div>
          
          <div className="space-y-4">
            <GoogleAuthButton
              onSuccess={handleAuthSuccess}
              onError={(error) => console.error('Erro na autenticação:', error)}
            />
          </div>
        </div>
        <Toaster />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background notranslate" translate="no">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        user={user}
        onLogout={handleLogout}
      />
      <main id="main-content" role="main" aria-label="Conteúdo principal" className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-6">
          {renderContent()}
        </div>
      </main>
      <Toaster />
    </div>
  )
}

export default App
