import { Warning, ArrowSquareOut } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function ConfigurationError() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-2xl w-full border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Warning size={32} className="text-destructive" weight="duotone" />
            </div>
            <div>
              <CardTitle className="text-2xl">Erro de Configuração</CardTitle>
              <CardDescription>
                O aplicativo não está configurado corretamente no Vercel
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <Warning className="h-4 w-4" />
            <AlertTitle>Erro 401 - Não Autorizado</AlertTitle>
            <AlertDescription>
              As variáveis de ambiente necessárias não estão configuradas no Vercel.
              O aplicativo não pode se conectar ao GitHub Spark Runtime.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Como Corrigir (3 passos):</h3>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Criar Token do GitHub</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Acesse as configurações do GitHub e crie um Personal Access Token com permissões <code className="px-1 py-0.5 rounded bg-muted text-xs">repo</code> e <code className="px-1 py-0.5 rounded bg-muted text-xs">workflow</code>
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://github.com/settings/tokens', '_blank')}
                  >
                    <ArrowSquareOut size={16} />
                    Criar Token
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Configurar Variáveis no Vercel</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Adicione as variáveis de ambiente no painel do Vercel em Settings → Environment Variables
                  </p>
                  <div className="bg-muted/50 p-3 rounded-lg text-xs font-mono space-y-1">
                    <div>GITHUB_TOKEN=ghp_seu_token</div>
                    <div>GITHUB_RUNTIME_PERMANENT_NAME=97a1cb1e48835e0ecf1e</div>
                    <div>GITHUB_API_URL=https://api.github.com</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    ⚠️ Marque Production, Preview E Development para cada variável
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Redesploy</h4>
                  <p className="text-sm text-muted-foreground">
                    Vá para Deployments → clique nos 3 pontos (...) → Redeploy
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2 text-sm">Documentação Completa:</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://github.com/thiagos-projects-9834ca6f/assistente-juridico-p/blob/main/LEIA_URGENTE.md', '_blank')}
              >
                <ArrowSquareOut size={16} />
                Guia Rápido
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://github.com/thiagos-projects-9834ca6f/assistente-juridico-p/blob/main/CORRECAO_ERRO_401.md', '_blank')}
              >
                <ArrowSquareOut size={16} />
                Guia Completo
              </Button>
            </div>
          </div>

          <Alert>
            <AlertDescription className="text-xs">
              💡 <strong>Dica:</strong> Execute <code className="px-1 py-0.5 rounded bg-muted">npm run check-config</code> localmente para verificar suas variáveis de ambiente antes de fazer o deploy.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
