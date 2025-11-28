import { useState, useEffect, useMemo } from 'react'
import { useKV } from '@/hooks/use-kv'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CalendarDots,
  Plus,
  CaretLeft,
  CaretRight,
  GoogleLogo,
  CloudArrowDown,
  CloudArrowUp,
  Link as LinkIcon,
  Trash,
  Warning,
  Info,
  ArrowsClockwise,
  CheckCircle,
  XCircle
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { googleCalendarService } from '@/lib/google-calendar-service'
import type { Appointment } from '@/types'

// Verificar se as credenciais do Google estão configuradas
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || ''
const isGoogleConfigured = !!GOOGLE_CLIENT_ID && !!GOOGLE_API_KEY

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
]

const EVENT_COLORS: Record<string, string> = {
  audiencia: 'bg-red-100 text-red-800 border-red-300',
  reuniao: 'bg-blue-100 text-blue-800 border-blue-300',
  prazo: 'bg-amber-100 text-amber-800 border-amber-300',
  outro: 'bg-gray-100 text-gray-800 border-gray-300',
  // English aliases
  hearing: 'bg-red-100 text-red-800 border-red-300',
  meeting: 'bg-blue-100 text-blue-800 border-blue-300',
  deadline: 'bg-amber-100 text-amber-800 border-amber-300',
  other: 'bg-gray-100 text-gray-800 border-gray-300'
}

// fallback para SSR (evita ReferenceError com window)
const SAFE_ORIGIN =
  typeof window !== 'undefined' ? window.location.origin : 'http://localhost'

export default function Calendar() {
  const [appointments, setAppointments] = useKV<Appointment[]>('appointments', [])
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [showDialog, setShowDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [syncEnabled, setSyncEnabled] = useKV<boolean>('calendar-sync-enabled', false)
  const [newAppointment, setNewAppointment] = useState<{
    title: string
    description: string
    type: Appointment['type']
    date: string
    time: string
    duration: number
    location: string
  }>({
    title: '',
    description: '',
    type: 'outro' as Appointment['type'],
    date: '',
    time: '',
    duration: 60,
    location: ''
  })

  // Verificar status do serviço ao montar
  useEffect(() => {
    try {
      const status = googleCalendarService.getStatus()
      setIsGoogleConnected(!!status.authenticated)
      if (status.lastError) {
        setConnectionError(status.lastError)
      }
    } catch (err) {
      console.error('[Calendar] Error getting status:', err)
    }
  }, [])

  // Inicializar o serviço Google Calendar automaticamente
  useEffect(() => {
    if (!isGoogleConfigured) return
    if (googleCalendarService.isInitialized()) return

    setIsInitializing(true)
    googleCalendarService
      .initialize()
      .then((success) => {
        console.log('[Calendar] Google Calendar initialized:', success)
        if (!success) {
          setConnectionError(googleCalendarService.getLastError() || 'Falha ao inicializar Google Calendar')
        }
      })
      .catch((err: unknown) => {
        console.error('[Calendar] Failed to initialize:', err)
        const msg = err instanceof Error ? err.message : 'Erro desconhecido ao inicializar'
        setConnectionError(msg)
      })
      .finally(() => {
        setIsInitializing(false)
      })
  }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const getDaysInMonth = () => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: (number | null)[] = []

    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }

  const getAppointmentsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return (appointments || []).filter((apt) => apt.date === dateStr)
  }

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleAddAppointment = async () => {
    if (!newAppointment.title.trim() || !newAppointment.date || !newAppointment.time) {
      toast.error('Título, data e horário são obrigatórios')
      return
    }

    const appointment: Appointment = {
      id: crypto.randomUUID(),
      ...newAppointment
    }

    setAppointments((current) => [...(current || []), appointment])

    if (syncEnabled && isGoogleConnected) {
      try {
        const result = await googleCalendarService.createEvent(appointment)
        if (result) {
          toast.success('Compromisso adicionado e sincronizado com Google Calendar')
        } else {
          toast.warning('Compromisso adicionado localmente, mas falha na sincronização')
        }
      } catch (err) {
        console.error('[Calendar] createEvent error:', err)
        toast.warning('Compromisso adicionado localmente, mas houve erro ao sincronizar')
      }
    } else {
      toast.success('Compromisso adicionado')
    }

    setShowDialog(false)
    setNewAppointment({
      title: '',
      description: '',
      type: 'outro' as Appointment['type'],
      date: '',
      time: '',
      duration: 60,
      location: ''
    })
  }

  const handleConnectGoogle = async () => {
    setConnectionError(null)
    setIsInitializing(true)

    try {
      console.log('[Calendar] Starting Google authentication...')
      toast.info('Conectando ao Google Calendar...', { duration: 3000 })

      const authenticated = await googleCalendarService.authenticate()

      if (authenticated) {
        setIsGoogleConnected(true)
        setConnectionError(null)
        toast.success('Conectado ao Google Calendar com sucesso!')
        console.log('[Calendar] Successfully authenticated')
      } else {
        const error = googleCalendarService.getLastError() || 'Falha na autenticação'
        setConnectionError(error)
        toast.error(error)
        console.error('[Calendar] Authentication failed:', error)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido'
      setConnectionError(errorMsg)
      toast.error(`Erro ao conectar: ${errorMsg}`)
      console.error('[Calendar] Connection error:', error)
    } finally {
      setIsInitializing(false)
    }
  }

  const handleSyncFromGoogle = async () => {
    if (!isGoogleConnected) {
      toast.error('Conecte-se ao Google Calendar primeiro')
      return
    }

    setIsSyncing(true)
    try {
      // TODO: implementar sync real quando o serviço estiver pronto
      toast.info('Sincronização automática em desenvolvimento')
      // Exemplo de fluxo comentado:
      // const startOfMonth = new Date(year, month, 1)
      // const endOfMonth = new Date(year, month + 1, 0)
      // const googleEvents = await googleCalendarService.syncEvents(startOfMonth, endOfMonth)
      // const mergedAppointments = [...(appointments || [])]
      // let newCount = 0
      // for (const event of googleEvents) {
      //   const exists = mergedAppointments.find(
      //     (apt) =>
      //       apt.date === event.date &&
      //       apt.time === event.time &&
      //       apt.title === event.title
      //   )
      //   if (!exists) {
      //     mergedAppointments.push(event)
      //     newCount++
      //   }
      // }
      // setAppointments(mergedAppointments)
      // toast.success(`Sincronização concluída: ${newCount} novos eventos importados`)
    } catch (error) {
      console.error('[Calendar] syncFromGoogle error:', error)
      toast.error('Erro ao sincronizar com Google Calendar')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSyncToGoogle = async () => {
    if (!isGoogleConnected) {
      toast.error('Conecte-se ao Google Calendar primeiro')
      return
    }

    setIsSyncing(true)
    try {
      let syncedCount = 0

      for (const appointment of appointments || []) {
        try {
          const result = await googleCalendarService.createEvent(appointment)
          if (result) {
            syncedCount++
          }
        } catch (err) {
          console.error('[Calendar] createEvent (bulk) error:', err)
        }
      }

      toast.success(`${syncedCount} evento(s) enviados ao Google Calendar`)
    } catch (error) {
      console.error('[Calendar] syncToGoogle error:', error)
      toast.error('Erro ao enviar eventos ao Google Calendar')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDeleteAppointment = async (appointment: Appointment) => {
    setAppointments((current) => (current || []).filter((apt) => apt.id !== appointment.id))

    if (syncEnabled && isGoogleConnected && appointment.id) {
      try {
        await googleCalendarService.deleteEvent(appointment.id)
      } catch (err) {
        console.error('[Calendar] deleteEvent error:', err)
      }
    }

    toast.success('Compromisso removido')
    setShowDetailsDialog(false)
  }

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setShowDetailsDialog(true)
  }

  const handleToggleSync = (enabled: boolean) => {
    if (enabled && !isGoogleConnected) {
      toast.error('Conecte-se ao Google Calendar primeiro')
      return
    }
    setSyncEnabled(enabled)
    toast.success(
      enabled ? 'Sincronização automática ativada' : 'Sincronização automática desativada'
    )
  }

  const days = useMemo(getDaysInMonth, [month, year])
  const today = new Date()

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  const sortedUpcomingAppointments = useMemo(
    () =>
      (appointments || [])
        .slice()
        .sort(
          (a, b) =>
            new Date(`${a.date}T${a.time}`).getTime() -
            new Date(`${b.date}T${b.time}`).getTime()
        ),
    [appointments]
  )

  const humanTypeLabel = (type: Appointment['type']) => {
    switch (type) {
      case 'audiencia':
      case 'hearing':
        return 'Audiência'
      case 'reuniao':
      case 'meeting':
        return 'Reunião'
      case 'prazo':
      case 'deadline':
        return 'Prazo'
      default:
        return 'Outro'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agenda Integrada</h1>
          <p className="text-muted-foreground mt-1">
            Compromissos, audiências e prazos
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Compromisso</DialogTitle>
                <DialogDescription>
                  Preencha os dados do novo evento
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={newAppointment.title}
                    onChange={(e) =>
                      setNewAppointment((prev) => ({ ...prev, title: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={newAppointment.type}
                    onValueChange={(value) =>
                      setNewAppointment((prev) => ({
                        ...prev,
                        type: value as Appointment['type']
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hearing">Audiência</SelectItem>
                      <SelectItem value="meeting">Reunião</SelectItem>
                      <SelectItem value="deadline">Prazo</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Data *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newAppointment.date}
                      onChange={(e) =>
                        setNewAppointment((prev) => ({ ...prev, date: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Horário *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newAppointment.time}
                      onChange={(e) =>
                        setNewAppointment((prev) => ({ ...prev, time: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Local</Label>
                  <Input
                    id="location"
                    value={newAppointment.location}
                    onChange={(e) =>
                      setNewAppointment((prev) => ({
                        ...prev,
                        location: e.target.value
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newAppointment.description}
                    onChange={(e) =>
                      setNewAppointment((prev) => ({
                        ...prev,
                        description: e.target.value
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddAppointment}>Adicionar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* CARD GOOGLE CALENDAR */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GoogleLogo className="w-8 h-8 text-blue-600" weight="fill" />
              <div>
                <CardTitle>Integração Google Calendar</CardTitle>
                <CardDescription>
                  {!isGoogleConfigured
                    ? 'Configure as credenciais do Google para habilitar a sincronização'
                    : isInitializing
                    ? 'Inicializando conexão...'
                    : isGoogleConnected
                    ? 'Conectado - seus eventos podem ser sincronizados'
                    : 'Conecte sua conta do Google para sincronizar eventos'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isInitializing && (
                <ArrowsClockwise className="w-5 h-5 text-blue-600 animate-spin" />
              )}
              <Badge
                variant={
                  isGoogleConnected
                    ? 'default'
                    : isGoogleConfigured
                    ? 'secondary'
                    : 'destructive'
                }
              >
                {isGoogleConnected ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Conectado
                  </span>
                ) : isGoogleConfigured ? (
                  'Desconectado'
                ) : (
                  <span className="flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Não Configurado
                  </span>
                )}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mostrar erro de conexão se houver */}
          {connectionError && (
            <Alert className="border-red-500 bg-red-50 dark:bg-red-950/20">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                <strong>Erro de Conexão</strong>
                <p className="mt-1 text-sm">{connectionError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setConnectionError(null)}
                >
                  Fechar
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {!isGoogleConfigured ? (
            <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
              <Warning className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>Configuração necessária</strong>
                <p className="mt-2 text-sm">
                  Para usar a integração com Google Calendar, configure as seguintes
                  variáveis no arquivo <code>.env</code>:
                </p>
                <ul className="mt-2 text-sm list-disc list-inside space-y-1">
                  <li>
                    <code>VITE_GOOGLE_CLIENT_ID</code>{' '}
                    {GOOGLE_CLIENT_ID ? '✓ Configurado' : '✗ Faltando'}
                  </li>
                  <li>
                    <code>VITE_GOOGLE_API_KEY</code>{' '}
                    {GOOGLE_API_KEY ? '✓ Configurado' : '✗ Faltando'}
                  </li>
                </ul>
                <p className="mt-2 text-sm">
                  Obtenha as credenciais em:{' '}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-600"
                  >
                    Google Cloud Console
                  </a>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Veja <code>OAUTH_SETUP.md</code> para instruções detalhadas.
                </p>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Info box com dicas de configuração */}
              {!isGoogleConnected && !connectionError && (
                <Alert className="border-blue-300 bg-blue-50 dark:bg-blue-950/20">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                    <strong>Dicas para conectar:</strong>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      <li>Certifique-se de que pop-ups não estão bloqueados</li>
                      <li>
                        A origem <code>{SAFE_ORIGIN}</code> deve estar autorizada no
                        Google Cloud Console
                      </li>
                      <li>A API do Google Calendar deve estar habilitada no projeto</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label
                    htmlFor="sync-toggle"
                    className="text-sm font-medium"
                  >
                    Sincronização Automática
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Novos eventos serão enviados automaticamente ao Google Calendar
                  </p>
                </div>
                <Switch
                  id="sync-toggle"
                  checked={!!syncEnabled}
                  onCheckedChange={handleToggleSync}
                  disabled={!isGoogleConnected}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {!isGoogleConnected && (
                  <Button
                    onClick={handleConnectGoogle}
                    variant="default"
                    disabled={isInitializing}
                  >
                    {isInitializing ? (
                      <>
                        <ArrowsClockwise className="w-4 h-4 mr-2 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <GoogleLogo className="w-4 h-4 mr-2" />
                        Conectar ao Google
                      </>
                    )}
                  </Button>
                )}

                {isGoogleConnected && (
                  <>
                    <Button
                      onClick={handleSyncFromGoogle}
                      variant="outline"
                      disabled={isSyncing}
                    >
                      <CloudArrowDown className="w-4 h-4 mr-2" />
                      {isSyncing ? 'Sincronizando...' : 'Importar do Google'}
                    </Button>

                    <Button
                      onClick={handleSyncToGoogle}
                      variant="outline"
                      disabled={isSyncing}
                    >
                      <CloudArrowUp className="w-4 h-4 mr-2" />
                      {isSyncing ? 'Sincronizando...' : 'Enviar ao Google'}
                    </Button>

                    <Button
                      onClick={() =>
                        window.open('https://calendar.google.com', '_blank')
                      }
                      variant="outline"
                    >
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Abrir Google Calendar
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* CARD CALENDÁRIO MENSAL */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">
              {MONTHS[month]} {year}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousMonth}
                aria-label="Mês anterior"
              >
                <CaretLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
                aria-label="Próximo mês"
              >
                <CaretRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-semibold text-muted-foreground p-2"
              >
                {day}
              </div>
            ))}

            {days.map((day, idx) => {
              const dayAppointments = day ? getAppointmentsForDay(day) : []
              const isValidDay = day !== null

              return (
                <div
                  key={idx}
                  className={`min-h-24 p-2 border rounded-lg ${
                    !isValidDay
                      ? 'bg-muted/30'
                      : isToday(day)
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card hover:bg-muted/50'
                  }`}
                >
                  {isValidDay && (
                    <>
                      <div
                        className={`text-sm font-medium mb-1 ${
                          isToday(day) ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayAppointments.slice(0, 2).map((apt) => (
                          <div
                            key={apt.id}
                            className={`text-xs p-1 rounded border ${
                              EVENT_COLORS[apt.type] || EVENT_COLORS.outro
                            } truncate cursor-pointer hover:opacity-80`}
                            onClick={() => handleViewDetails(apt)}
                          >
                            {apt.time} {apt.title}
                          </div>
                        ))}
                        {dayAppointments.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayAppointments.length - 2} mais
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* CARD PRÓXIMOS COMPROMISSOS */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Compromissos</CardTitle>
          <CardDescription>Eventos agendados para os próximos dias</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedUpcomingAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarDots className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum compromisso agendado
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedUpcomingAppointments.slice(0, 5).map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleViewDetails(apt)}
                >
                  <CalendarDots
                    className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                    weight="fill"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium">{apt.title}</p>
                      <Badge
                        className={
                          EVENT_COLORS[apt.type] || EVENT_COLORS.outro
                        }
                      >
                        {humanTypeLabel(apt.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(apt.date).toLocaleDateString('pt-BR')} às{' '}
                      {apt.time}
                    </p>
                    {apt.location && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {apt.location}
                      </p>
                    )}
                    {apt.description && (
                      <p className="text-sm mt-2">{apt.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL DETALHES */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Compromisso</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Título</Label>
                <p className="text-lg font-semibold">
                  {selectedAppointment.title}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Data</Label>
                  <p className="font-medium">
                    {new Date(selectedAppointment.date).toLocaleDateString(
                      'pt-BR',
                      {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      }
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Horário</Label>
                  <p className="font-medium">{selectedAppointment.time}</p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Tipo</Label>
                <div className="mt-1">
                  <Badge
                    className={
                      EVENT_COLORS[selectedAppointment.type] ||
                      EVENT_COLORS.outro
                    }
                  >
                    {humanTypeLabel(selectedAppointment.type)}
                  </Badge>
                </div>
              </div>

              {selectedAppointment.location && (
                <div>
                  <Label className="text-xs text-muted-foreground">Local</Label>
                  <p>{selectedAppointment.location}</p>
                </div>
              )}

              {selectedAppointment.description && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Descrição
                  </Label>
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedAppointment.description}
                  </p>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteAppointment(selectedAppointment)}
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsDialog(false)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
