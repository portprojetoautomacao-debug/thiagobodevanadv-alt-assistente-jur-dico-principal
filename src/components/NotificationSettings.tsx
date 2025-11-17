import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Bell, CheckCircle, XCircle, Warning } from '@phosphor-icons/react'
import { useNotifications } from '@/hooks/use-notifications'
import { toast } from 'sonner'

export default function NotificationSettings() {
  const { preferences, setPreferences, requestPermission, testNotification, isSupported, permission } = useNotifications()

  const handleEnableNotifications = async () => {
    if (!isSupported) {
      toast.error('Seu navegador não suporta notificações')
      return
    }

    const result = await requestPermission()
    
    if (result === 'granted') {
      toast.success('Notificações ativadas com sucesso!')
      testNotification()
    } else if (result === 'denied') {
      toast.error('Você bloqueou as notificações. Ative-as nas configurações do navegador.')
    }
  }

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge variant="default" className="gap-1 bg-primary"><CheckCircle size={12} weight="fill" /> Permitido</Badge>
      case 'denied':
        return <Badge variant="destructive" className="gap-1"><XCircle size={12} weight="fill" /> Bloqueado</Badge>
      default:
        return <Badge variant="secondary" className="gap-1"><Warning size={12} weight="fill" /> Pendente</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold gradient-text mb-2">Configurações de Notificações</h1>
        <p className="text-muted-foreground">
          Configure os alertas que deseja receber
        </p>
      </div>

      <div className="space-y-6">
        <Card className="glassmorphic border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="text-primary" size={24} weight="duotone" />
                  Status das Notificações
                </CardTitle>
                <CardDescription className="mt-2">
                  Permissão do navegador para enviar notificações
                </CardDescription>
              </div>
              {getPermissionBadge()}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isSupported && (
              <Alert variant="destructive">
                <XCircle size={16} weight="fill" />
                <AlertDescription>
                  Seu navegador não suporta notificações push. Tente usar Chrome, Firefox ou Edge.
                </AlertDescription>
              </Alert>
            )}

            {isSupported && permission === 'default' && (
              <Alert className="border-primary/50 bg-primary/5">
                <Warning className="text-primary" size={16} weight="fill" />
                <AlertDescription>
                  Você ainda não permitiu notificações. Clique no botão abaixo para ativar.
                </AlertDescription>
              </Alert>
            )}

            {isSupported && permission === 'denied' && (
              <Alert variant="destructive">
                <XCircle size={16} weight="fill" />
                <AlertDescription>
                  Notificações bloqueadas. Para ativar, clique no ícone de cadeado ao lado da URL e permita notificações.
                </AlertDescription>
              </Alert>
            )}

            {isSupported && permission === 'granted' && (
              <Alert className="border-primary/50 bg-primary/5">
                <CheckCircle className="text-primary" size={16} weight="fill" />
                <AlertDescription>
                  Notificações ativadas! Você receberá alertas importantes.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              {permission !== 'granted' && (
                <Button
                  onClick={handleEnableNotifications}
                  className="button-gradient"
                  disabled={!isSupported || permission === 'denied'}
                >
                  <Bell size={20} weight="duotone" />
                  Ativar Notificações
                </Button>
              )}
              
              {permission === 'granted' && (
                <Button
                  onClick={testNotification}
                  variant="outline"
                >
                  <Bell size={20} weight="duotone" />
                  Testar Notificação
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphic border-border/50">
          <CardHeader>
            <CardTitle>Tipos de Notificações</CardTitle>
            <CardDescription>
              Escolha quais tipos de alertas deseja receber
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="prazo-alerts" className="text-base font-medium">
                  Alertas de Prazos
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações sobre prazos próximos do vencimento (D-7, D-2, D-1)
                </p>
              </div>
              <Switch
                id="prazo-alerts"
                checked={preferences?.prazoAlerts ?? true}
                onCheckedChange={(checked) =>
                  setPreferences((current) => ({ ...current, prazoAlerts: checked }))
                }
                disabled={permission !== 'granted'}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="agent-alerts" className="text-base font-medium">
                  Alertas de Agentes IA
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações quando agentes autônomos completarem tarefas
                </p>
              </div>
              <Switch
                id="agent-alerts"
                checked={preferences?.agentAlerts ?? true}
                onCheckedChange={(checked) =>
                  setPreferences((current) => ({ ...current, agentAlerts: checked }))
                }
                disabled={permission !== 'granted'}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="financial-alerts" className="text-base font-medium">
                  Alertas Financeiros
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações sobre honorários vencidos e pagamentos pendentes
                </p>
              </div>
              <Switch
                id="financial-alerts"
                checked={preferences?.financialAlerts ?? true}
                onCheckedChange={(checked) =>
                  setPreferences((current) => ({ ...current, financialAlerts: checked }))
                }
                disabled={permission !== 'granted'}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphic border-border/50">
          <CardHeader>
            <CardTitle>Sobre as Notificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Prazos:</strong> Você receberá alertas automáticos 7, 2 e 1 dia antes do vencimento de cada prazo ativo.
            </p>
            <p>
              <strong className="text-foreground">Privacidade:</strong> As notificações são processadas localmente no seu navegador. Nenhum dado é enviado para servidores externos.
            </p>
            <p>
              <strong className="text-foreground">Controle:</strong> Você pode desativar as notificações a qualquer momento usando os switches acima.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
