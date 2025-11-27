// Exemplo de como usar Error Tracking no seu App.tsx

import { useEffect } from 'react'
import { useUserTracking, usePageTracking } from '../hooks/useErrorTracking'
import { captureMessage, setErrorTag } from '../services/error-tracking'

export function AppWithErrorTracking({ user }: { user?: { id: string; email: string } }) {
  // Rastrear usuário logado
  useUserTracking(user?.id, user?.email)

  // Rastrear navegação de páginas
  usePageTracking()

  // Rastrear versão do app
  useEffect(() => {
    const version = process.env.REACT_APP_VERSION || process.env.VITE_APP_VERSION || 'unknown'
    const env = process.env.NODE_ENV || 'development'
    
    setErrorTag('app_version', version)
    setErrorTag('environment', env)
    
    captureMessage(`App started - Version ${version} (${env})`, 'info')
  }, [])

  return (
    <div>
      {/* Seu App aqui */}
    </div>
  )
}
