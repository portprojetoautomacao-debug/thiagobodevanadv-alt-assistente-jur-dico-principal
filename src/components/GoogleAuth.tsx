import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Warning } from '@phosphor-icons/react'
import { config, validateConfig } from '@/lib/config'

interface GoogleUser {
  id: string
  email: string
  name: string
  picture: string
}

interface GoogleAuthButtonProps {
  onSuccess?: (user: GoogleUser) => void
  onError?: (error: Error) => void
}

export function GoogleAuthButton({ onSuccess, onError }: GoogleAuthButtonProps) {
  const [error, setError] = useState<string>('')
  const [isConfigured, setIsConfigured] = useState(false)

  useEffect(() => {
    const configured = validateConfig()
    setIsConfigured(configured)

    if (!configured) {
      setError('Google OAuth não está configurado. Veja OAUTH_SETUP.md para instruções.')
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = initializeGoogleSignIn
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  const initializeGoogleSignIn = () => {
    if (!(window as any).google) return

    ;(window as any).google.accounts.id.initialize({
      client_id: config.google.clientId,
      callback: handleCredentialResponse,
    })

    const buttonDiv = document.getElementById('google-signin-button')
    if (buttonDiv) {
      ;(window as any).google.accounts.id.renderButton(buttonDiv, {
        theme: 'outline',
        size: 'large',
        width: buttonDiv.offsetWidth,
        text: 'signin_with',
        shape: 'rectangular',
      })
    }
  }

  const handleCredentialResponse = async (response: any) => {
    try {
      const credential = response.credential
      const payload = JSON.parse(atob(credential.split('.')[1]))

      const user: GoogleUser = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      }

      onSuccess?.(user)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Falha ao processar login do Google')
      setError(error.message)
      onError?.(error)
    }
  }

  if (!isConfigured) {
    return (
      <Alert variant="destructive">
        <Warning className="h-4 w-4" />
        <AlertDescription>
          <strong>Configuração OAuth Necessária</strong>
          <p className="mt-2 text-sm">
            As credenciais do Google OAuth não estão configuradas. Por favor:
          </p>
          <ol className="mt-2 text-sm list-decimal list-inside space-y-1">
            <li>Copie <code>.env.example</code> para <code>.env</code></li>
            <li>Adicione seu Google Client ID ao <code>.env</code></li>
            <li>Veja <code>OAUTH_SETUP.md</code> para instruções detalhadas</li>
          </ol>
        </AlertDescription>
      </Alert>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Warning className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="w-full">
      <div id="google-signin-button" className="w-full" />
    </div>
  )
}

export function GoogleAuthExample() {
  const [user, setUser] = useState<GoogleUser | null>(null)

  const handleSuccess = (user: GoogleUser) => {
    console.log('Usuário logado:', user)
    setUser(user)
  }

  const handleError = (error: Error) => {
    console.error('Erro no login:', error)
  }

  const handleSignOut = () => {
    setUser(null)
  }

  if (user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo, {user.name}!</CardTitle>
          <CardDescription>Você está conectado com o Google</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <img
              src={user.picture}
              alt={user.name}
              className="w-16 h-16 rounded-full"
            />
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="outline" className="w-full">
            Sair
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login com Google</CardTitle>
        <CardDescription>
          Use sua conta Google para fazer login com segurança
        </CardDescription>
      </CardHeader>
      <CardContent>
        <GoogleAuthButton onSuccess={handleSuccess} onError={handleError} />
      </CardContent>
    </Card>
  )
}
