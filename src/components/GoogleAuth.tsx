import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, Ca
import { Warning } from '@phosphor-icons/react'

import { Warning } from '@phosphor-icons/react'
import { config, validateConfig } from '@/lib/config'

interface GoogleAuthButtonProps {
  picture: string

 

          initialize: 
          pr
      }
  }
  picture: string
 

    const isVali

      setError
    }
    const scr
    script.async = true
    script.onload = initializeGoogleSignIn

      doc
      }
  con
  }
 

    })
    const buttonDiv = document.getElementById('google-sig
      window.google.accounts.id.renderButton(buttonDiv, {

        text: 'sign
      })
  }

      const credent

        id: 
     

      onSuccess?.(user)
      const error = err instanceof Error ? err : new Erro
    script.async = true
  }
    script.onload = initializeGoogleSignIn
      <Alert variant="destructive">

          <p class
          </p>
     
        

    )


        <Warning className="h-4 w-4" />
      </Alert>
  }
  return (
      <div id="google-signin-butto
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

}

export function GoogleAuthExample() {


  const handleSuccess = (user: GoogleUser) => {
    console.log('User signed in:', user)

  }

  const handleError = (error: Error) => {
    console.error('Sign-in error:', error)
  }

  const handleSignOut = () => {

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

              src={user.picture}
              alt={user.name}
              className="w-16 h-16 rounded-full"

            <div>

              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="outline" className="w-full">
            Sign Out

        </CardContent>

    )



    <Card>
      <CardHeader>
        <CardTitle>Sign in with Google</CardTitle>
        <CardDescription>
          Use your Google account to sign in securely
        </CardDescription>
      </CardHeader>

        <GoogleAuthButton onSuccess={handleSuccess} onError={handleError} />

    </Card>

}
