import { useState, useEffect } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { GoogleAuthButton } from '@/components/GoogleAuth'
import type { GoogleUser } from '@/components/GoogleAuth'
import Sidebar from '@/components/Sidebar'
import Dashboard from '@/components/Dashboard'
import ProcessCRM from '@/components/ProcessCRM'
import Calendar from '@/components/Calendar'
import FinancialManagement from '@/components/FinancialManagement'
import CalculadoraPrazos from '@/components/CalculadoraPrazos'
import PDFUploader from '@/components/PDFUploader'
import MinutasManager from '@/components/MinutasManager'
import Donna from '@/components/Donna'
import AIAgents from '@/components/AIAgents'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import { useKV } from '@/hooks/use-kv'
import type { ViewType, User } from '@/types'

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
        return <ProcessCRM />
      case 'calendar':
      case 'calendario':
        return <Calendar />
      case 'financeiro':
        return <FinancialManagement />
      case 'prazos':
      case 'calculadora':
        return <CalculadoraPrazos />
      case 'upload-pdf':
        return <PDFUploader />
      case 'minutas':
        return <MinutasManager />
      case 'donna':
      case 'assistente':
        return <Donna />
      case 'ai-agents':
        return <AIAgents onNavigate={setCurrentView} />
      case 'analytics':
        return <AnalyticsDashboard />
      default:
        return <Dashboard onNavigate={setCurrentView} />
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
    <div className="flex h-screen bg-background">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        user={user}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-6">
          {renderContent()}
        </div>
      </main>
      <Toaster />
    </div>
  )
}

export default App
