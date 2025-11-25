import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Warning } from '@phosphor-icons/react'
import { GithubLogo } from '@phosphor-icons/react'
import { config, validateConfig } from '@/lib/config'

export interface GitHubUser {
  id: string
  login: string
  email: string
  name: string
  avatar_url: string
  role?: 'admin' | 'advogado' | 'assistente'
}

interface GitHubAuthButtonProps {
  onSuccess?: (user: GitHubUser) => void
  onError?: (error: Error) => void
}

export function GitHubAuthButton({ onSuccess, onError }: GitHubAuthButtonProps) {
  const [error, setError] = useState<string>('')
  const [isConfigured, setIsConfigured] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const checkConfig = () => {
      try {
        validateConfig()
        const clientId = config.github.oauthClientId
        setIsConfigured(!!clientId)
      } catch (err) {
        setIsConfigured(false)
      }
    }

    checkConfig()
  }, [])

  const handleGitHubLogin = useCallback(async () => {
    if (!isConfigured) {
      setError('GitHub OAuth não está configurado')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const clientId = config.github.oauthClientId
      const redirectUri = config.google.redirectUri

      // GitHub OAuth URL
      const githubUrl = new URL('https://github.com/login/oauth/authorize')
      githubUrl.searchParams.set('client_id', clientId)
      githubUrl.searchParams.set('redirect_uri', redirectUri)
      githubUrl.searchParams.set('scope', 'user:email')
      githubUrl.searchParams.set('state', 'github-oauth')

      // Redirect to GitHub
      window.location.href = githubUrl.toString()
    } catch (err) {
      const error = err as Error
      setError(error.message)
      onError?.(error)
      setIsLoading(false)
    }
  }, [isConfigured, onSuccess, onError])

  // Handle OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const state = urlParams.get('state')

      if (code && state === 'github-oauth') {
        setIsLoading(true)
        try {
          // Exchange code for access token
          const response = await fetch('/api/auth/github', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          })

          if (!response.ok) {
            throw new Error('Falha na autenticação com GitHub')
          }

          const data = await response.json()
          const user: GitHubUser = {
            id: data.id,
            login: data.login,
            email: data.email,
            name: data.name,
            avatar_url: data.avatar_url,
          }

          onSuccess?.(user)

          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname)
        } catch (err) {
          const error = err as Error
          setError(error.message)
          onError?.(error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    handleCallback()
  }, [onSuccess, onError])

  if (!isConfigured) {
    return (
      <Alert>
        <Warning className="h-4 w-4" />
        <AlertDescription>
          GitHub OAuth não está configurado. Verifique as variáveis de ambiente.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GithubLogo className="h-5 w-5" />
          Entrar com GitHub
        </CardTitle>
        <CardDescription>
          Use sua conta GitHub para acessar o sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleGitHubLogin}
          disabled={isLoading}
          className="w-full"
          variant="outline"
        >
          <GithubLogo className="mr-2 h-4 w-4" />
          {isLoading ? 'Conectando...' : 'Continuar com GitHub'}
        </Button>

        {error && (
          <Alert className="mt-4">
            <Warning className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}