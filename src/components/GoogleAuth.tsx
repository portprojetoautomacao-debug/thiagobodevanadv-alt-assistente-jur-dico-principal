import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Warning } from '@phosphor-icons/react'
import { config, validateConfig } from '@/lib/config'

interface GoogleAuthButtonProps {
  onSuccess?: (user: GoogleUser) => void
  onError?: (error: Error) => void
}

interface GoogleUser {
  id: string
  email: string
  name: string
  picture: string
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          renderButton: (element: HTMLElement, config: any) => void
          prompt: () => void
        }
      }
    }
  }
}

export function GoogleAuthButton({ onSuccess, onError }: GoogleAuthButtonProps) {
  const [isConfigured, setIsConfigured] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const isValid = validateConfig()
    setIsConfigured(isValid)

    if (!isValid) {
      setError('Google OAuth is not properly configured. See OAUTH_SETUP.md for instructions.')
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = initializeGoogleSignIn
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const initializeGoogleSignIn = () => {
    if (!window.google) return

    window.google.accounts.id.initialize({
      client_id: config.google.clientId,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    })

    const buttonDiv = document.getElementById('google-signin-button')
    if (buttonDiv) {
      window.google.accounts.id.renderButton(buttonDiv, {
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
      const error = err instanceof Error ? err : new Error('Failed to process Google sign-in')
      setError(error.message)
      onError?.(error)
    }
  }

  if (!isConfigured) {
    return (
      <Alert variant="destructive">
        <Warning className="h-4 w-4" />
        <AlertDescription>
          <strong>OAuth Configuration Required</strong>
          <p className="mt-2 text-sm">
            Google OAuth credentials are not configured. Please:
          </p>
          <ol className="mt-2 text-sm list-decimal list-inside space-y-1">
            <li>Copy <code>.env.example</code> to <code>.env</code></li>
            <li>Add your Google Client ID to <code>.env</code></li>
            <li>See <code>OAUTH_SETUP.md</code> for detailed instructions</li>
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
    console.log('User signed in:', user)
    setUser(user)
  }

  const handleError = (error: Error) => {
    console.error('Sign-in error:', error)
  }

  const handleSignOut = () => {
    setUser(null)
  }

  if (user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {user.name}!</CardTitle>
          <CardDescription>You are signed in with Google</CardDescription>
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
            Sign Out
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in with Google</CardTitle>
        <CardDescription>
          Use your Google account to sign in securely
        </CardDescription>
      </CardHeader>
      <CardContent>
        <GoogleAuthButton onSuccess={handleSuccess} onError={handleError} />
      </CardContent>
    </Card>
  )
}
