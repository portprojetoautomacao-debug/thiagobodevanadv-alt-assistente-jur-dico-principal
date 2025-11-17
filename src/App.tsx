import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Spark</CardTitle>
          <CardDescription>Your app is ready to be customized</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full">Get Started</Button>
        </CardContent>
      </Card>
    </div>
  )
}
