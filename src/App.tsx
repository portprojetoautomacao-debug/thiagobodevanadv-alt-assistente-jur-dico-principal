import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Toaster } from '@/components/ui/sonner'
import Login from '@/components/Login'
import Dashboard from '@/components/Dashboard'
import Sidebar from '@/components/Sidebar'
import ProcessCRM from '@/components/ProcessCRM'
import ExpedientePanel from '@/components/ExpedientePanel'
import BatchAnalysis from '@/components/BatchAnalysis'
import AudioTranscription from '@/components/AudioTranscription'
import DeadlineCalculator from '@/components/DeadlineCalculator'
import DatabaseQueries from '@/components/DatabaseQueries'
import Calendar from '@/components/Calendar'
import FinancialManagement from '@/components/FinancialManagement'
import KnowledgeBase from '@/components/KnowledgeBase'
import type { User } from '@/types'

function App() {
  const [currentUser, setCurrentUser] = useKV<User | null>('currentUser', null)
  const [currentView, setCurrentView] = useState<string>('dashboard')

  const handleLogin = (user: User) => {
    setCurrentUser(user)
    setCurrentView('dashboard')
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setCurrentView('dashboard')
  }

  if (!currentUser) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toaster />
      </>
    )
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard user={currentUser} />
      case 'processes':
        return <ProcessCRM />
      case 'expedientes':
        return <ExpedientePanel />
      case 'batch':
        return <BatchAnalysis />
      case 'audio':
        return <AudioTranscription />
      case 'calculator':
        return <DeadlineCalculator />
      case 'queries':
        return <DatabaseQueries />
      case 'calendar':
        return <Calendar />
      case 'financial':
        return <FinancialManagement />
      case 'knowledge':
        return <KnowledgeBase />
      default:
        return <Dashboard user={currentUser} />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView}
        user={currentUser}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-auto">
        {renderView()}
      </main>
      <Toaster />
    </div>
  )
}

export default App