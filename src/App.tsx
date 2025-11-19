import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkle } from '@phosphor-icons/react'

function App() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkle size={32} className="text-primary" weight="duotone" />
          </div>
          <CardTitle className="text-2xl">Welcome to Spark</CardTitle>
          <CardDescription>
            Your app is ready to be built
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            This is a fresh Spark template. Start building your application by modifying the App.tsx file.
          </p>
          <Button className="w-full" size="lg">
            Get Started
          </Button>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  )
}

export default App
