/**
 * Color Preview Component
 * Para testar o novo tema azul e branco
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function ColorPreview() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-primary mb-2">
          Tema Azul e Branco
        </h1>
        <p className="text-muted-foreground">
          Novo esquema de cores profissional e moderno
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">Primário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button className="w-full">Botão Primário</Button>
              <Badge>Badge Primário</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-secondary/20">
          <CardHeader>
            <CardTitle className="text-secondary-foreground">Secundário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="secondary" className="w-full">Botão Secundário</Button>
              <Badge variant="secondary">Badge Secundário</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="text-accent-foreground">Accent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full">Botão Outline</Button>
              <Badge variant="outline">Badge Outline</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paleta de Cores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-11 gap-2">
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => (
              <div key={shade} className="space-y-1">
                <div 
                  className={`h-16 rounded-md bg-blue-${shade} border border-border`}
                  style={{ backgroundColor: `var(--color-accent-${Math.floor(shade / 100) + 1})` }}
                />
                <p className="text-xs text-center text-muted-foreground">{shade}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
