import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { CalendarDots, Plus, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Appointment } from '@/types'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const EVENT_COLORS = {
  hearing: 'bg-red-100 text-red-800 border-red-300',
  meeting: 'bg-blue-100 text-blue-800 border-blue-300',
  deadline: 'bg-amber-100 text-amber-800 border-amber-300',
  other: 'bg-gray-100 text-gray-800 border-gray-300',
}

export default function Calendar() {
  const [appointments, setAppointments] = useKV<Appointment[]>('appointments', [])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showDialog, setShowDialog] = useState(false)
  const [newAppointment, setNewAppointment] = useState({
    title: '',
    description: '',
    type: 'other' as Appointment['type'],
    date: '',
    time: '',
    location: '',
  })

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
    return (appointments || []).filter(apt => apt.date === dateStr)
  }

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1))
  }

  const handleAddAppointment = () => {
    if (!newAppointment.title || !newAppointment.date || !newAppointment.time) {
      toast.error('Título, data e horário são obrigatórios')
      return
    }

    const appointment: Appointment = {
      id: crypto.randomUUID(),
      ...newAppointment,
    }

    setAppointments((current) => [...(current || []), appointment])
    setShowDialog(false)
    setNewAppointment({ title: '', description: '', type: 'other', date: '', time: '', location: '' })
    toast.success('Compromisso adicionado')
  }

  const days = getDaysInMonth()
  const today = new Date()
  const isToday = (day: number) => {
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
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
                  onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={newAppointment.type} onValueChange={(value) => setNewAppointment({ ...newAppointment, type: value as Appointment['type'] })}>
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
                    onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Horário *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Local</Label>
                <Input
                  id="location"
                  value={newAppointment.location}
                  onChange={(e) => setNewAppointment({ ...newAppointment, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newAppointment.description}
                  onChange={(e) => setNewAppointment({ ...newAppointment, description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddAppointment}>
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{MONTHS[month]} {year}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                <CaretLeft className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <CaretRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
                {day}
              </div>
            ))}

            {days.map((day, idx) => {
              const dayAppointments = day ? getAppointmentsForDay(day) : []
              return (
                <div
                  key={idx}
                  className={`min-h-24 p-2 border rounded-lg ${
                    day === null
                      ? 'bg-muted/30'
                      : isToday(day)
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card hover:bg-muted/50'
                  }`}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-primary' : 'text-foreground'}`}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayAppointments.slice(0, 2).map((apt) => (
                          <div key={apt.id} className={`text-xs p-1 rounded border ${EVENT_COLORS[apt.type]} truncate`}>
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

      <Card>
        <CardHeader>
          <CardTitle>Próximos Compromissos</CardTitle>
          <CardDescription>Eventos agendados para os próximos dias</CardDescription>
        </CardHeader>
        <CardContent>
          {(appointments || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarDots className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum compromisso agendado
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {(appointments || [])
                .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
                .slice(0, 5)
                .map((apt) => (
                  <div key={apt.id} className="flex items-start gap-3 p-4 border rounded-lg">
                    <CalendarDots className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" weight="fill" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium">{apt.title}</p>
                        <Badge className={EVENT_COLORS[apt.type]}>{apt.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(apt.date).toLocaleDateString('pt-BR')} às {apt.time}
                      </p>
                      {apt.location && (
                        <p className="text-sm text-muted-foreground mt-1">{apt.location}</p>
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
    </div>
  )
}
