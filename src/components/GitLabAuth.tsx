import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Warning } from '@phosphor-icons/react'
import { config, validateConfig } from '@/lib/config'

export interface GitLabUser {
  id: string
  login: string
  email: string
  name: string
  avatar_url: string
  role?: 'admin' | 'advogado' | 'assistente'
}

interface GitLabAuthButtonProps {
  onSuccess?: (user: GitLabUser) => void
  onError?: (error: Error) => void
}

export function GitLabAuthButton({ onSuccess, onError }: GitLabAuthButtonProps) {
  const [error, setError] = useState<string>('')
  const [isConfigured, setIsConfigured] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const checkConfig = () => {
      try {
        validateConfig()
        const clientId = config.gitlab.oauthClientId
        setIsConfigured(!!clientId)
      } catch {
        setIsConfigured(false)
      }
    }

    checkConfig()
  }, [])

  const handleGitLabLogin = useCallback(async () => {
    if (!isConfigured) {
      setError('GitLab OAuth não está configurado')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const clientId = config.gitlab.oauthClientId
      const redirectUri = config.gitlab.redirectUri

      // GitLab OAuth URL
      const gitlabUrl = new URL('https://gitlab.com/oauth/authorize')
      gitlabUrl.searchParams.set('client_id', clientId)
      gitlabUrl.searchParams.set('redirect_uri', redirectUri)
      gitlabUrl.searchParams.set('response_type', 'code')
      gitlabUrl.searchParams.set('scope', 'read_user')
      gitlabUrl.searchParams.set('state', 'gitlab-oauth')

      // Redirect to GitLab
      window.location.href = gitlabUrl.toString()
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

      if (code && state === 'gitlab-oauth') {
        setIsLoading(true)
        try {
          // Exchange code for access token
          const response = await fetch('/api/auth/gitlab', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          })

          if (!response.ok) {
            throw new Error('Falha na autenticação com GitLab')
          }

          const data = await response.json()
          const user: GitLabUser = {
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
          GitLab OAuth não está configurado. Verifique as variáveis de ambiente.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.955 13.587l-1.342-4.135-2.664-8.189c-.135-.414-.549-.587-.823-.236L12 6.224 4.874.027c-.275-.36-.688-.178-.823.236L1.387 9.452.045 13.587c-.121.37.135.799.549.799h6.342l1.342 4.135c.135.414.549.587.823.236L12 17.776l4.941 6.981c.275.36.688.178.823-.236l1.342-4.135h6.342c.414 0 .67-.429.549-.799z" />
          </svg>
          Entrar com GitLab
        </CardTitle>
        <CardDescription>
          Use sua conta GitLab para acessar o sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleGitLabLogin}
          disabled={isLoading}
          className="w-full"
          variant="outline"
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.955 13.587l-1.342-4.135-2.664-8.189c-.135-.414-.549-.587-.823-.236L12 6.224 4.874.027c-.275-.36-.688-.178-.823.236L1.387 9.452.045 13.587c-.121.37.135.799.549.799h6.342l1.342 4.135c.135.414.549.587.823.236L12 17.776l4.941 6.981c.275.36.688.178.823-.236l1.342-4.135h6.342c.414 0 .67-.429.549-.799z" />
          </svg>
          {isLoading ? 'Conectando...' : 'Continuar com GitLab'}
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