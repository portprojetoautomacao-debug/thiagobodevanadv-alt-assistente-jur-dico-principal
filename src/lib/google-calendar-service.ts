import { Appointment } from '@/types'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || ''
const SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events'

interface GoogleAuthResponse {
  access_token: string
  expires_in: number
  token_type: string
  error?: string
}

interface GoogleCalendarEvent {
  id?: string
  summary: string
  description?: string
  location?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  colorId?: string
  reminders?: {
    useDefault: boolean
    overrides?: Array<{
      method: string
      minutes: number
    }>
  }
}

const EVENT_COLOR_MAP = {
  hearing: '11',
  meeting: '9',
  deadline: '5',
  other: '8',
}

class GoogleCalendarService {
  private tokenClient: any = null
  private accessToken: string | null = null
  private gapiInited = false
  private gisInited = false
  private calendarId = 'primary'

  async initialize(): Promise<void> {
    if (this.gapiInited && this.gisInited) return

    await this.loadGoogleScripts()
    await this.initializeGapi()
    this.initializeGis()
  }

  private loadGoogleScripts(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src*="apis.google.com"]')) {
        resolve()
        return
      }

      const gapiScript = document.createElement('script')
      gapiScript.src = 'https://apis.google.com/js/api.js'
      gapiScript.async = true
      gapiScript.defer = true
      gapiScript.onload = () => {
        const gisScript = document.createElement('script')
        gisScript.src = 'https://accounts.google.com/gsi/client'
        gisScript.async = true
        gisScript.defer = true
        gisScript.onload = () => resolve()
        gisScript.onerror = reject
        document.body.appendChild(gisScript)
      }
      gapiScript.onerror = reject
      document.body.appendChild(gapiScript)
    })
  }

  private async initializeGapi(): Promise<void> {
    return new Promise((resolve) => {
      ;(window as any).gapi.load('client', async () => {
        await (window as any).gapi.client.init({
          apiKey: GOOGLE_API_KEY,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        })
        this.gapiInited = true
        resolve()
      })
    })
  }

  private initializeGis(): void {
    this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: '',
    })
    this.gisInited = true
  }

  async authenticate(): Promise<boolean> {
    if (!this.gapiInited || !this.gisInited) {
      await this.initialize()
    }

    return new Promise((resolve) => {
      this.tokenClient.callback = (resp: GoogleAuthResponse) => {
        if (resp.error !== undefined) {
          resolve(false)
          return
        }
        this.accessToken = resp.access_token
        resolve(true)
      }

      if (this.accessToken === null) {
        this.tokenClient.requestAccessToken({ prompt: 'consent' })
      } else {
        this.tokenClient.requestAccessToken({ prompt: '' })
      }
    })
  }

  private convertAppointmentToGoogleEvent(appointment: Appointment): GoogleCalendarEvent {
    const startDateTime = new Date(`${appointment.date}T${appointment.time}`)
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000)

    return {
      summary: appointment.title,
      description: appointment.description || '',
      location: appointment.location || '',
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      colorId: EVENT_COLOR_MAP[appointment.type] || EVENT_COLOR_MAP.other,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    }
  }

  private convertGoogleEventToAppointment(event: any): Appointment {
    const startDateTime = new Date(event.start.dateTime || event.start.date)
    const date = startDateTime.toISOString().split('T')[0]
    const time = startDateTime.toTimeString().slice(0, 5)

    let type: Appointment['type'] = 'other'
    const colorId = event.colorId || '8'
    const colorEntry = Object.entries(EVENT_COLOR_MAP).find(([, id]) => id === colorId)
    if (colorEntry) {
      type = colorEntry[0] as Appointment['type']
    }

    return {
      id: event.id,
      title: event.summary || 'Sem título',
      description: event.description || '',
      type,
      date,
      time,
      location: event.location || '',
    }
  }

  async createEvent(appointment: Appointment): Promise<{ id: string; link: string } | null> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate()
      if (!authenticated) return null
    }

    try {
      const event = this.convertAppointmentToGoogleEvent(appointment)
      
      const response = await (window as any).gapi.client.calendar.events.insert({
        calendarId: this.calendarId,
        resource: event,
      })

      return {
        id: response.result.id,
        link: response.result.htmlLink,
      }
    } catch (error) {
      console.error('Erro ao criar evento no Google Calendar:', error)
      return null
    }
  }

  async updateEvent(
    eventId: string,
    appointment: Appointment
  ): Promise<{ id: string; link: string } | null> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate()
      if (!authenticated) return null
    }

    try {
      const event = this.convertAppointmentToGoogleEvent(appointment)

      const response = await (window as any).gapi.client.calendar.events.update({
        calendarId: this.calendarId,
        eventId: eventId,
        resource: event,
      })

      return {
        id: response.result.id,
        link: response.result.htmlLink,
      }
    } catch (error) {
      console.error('Erro ao atualizar evento no Google Calendar:', error)
      return null
    }
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate()
      if (!authenticated) return false
    }

    try {
      await (window as any).gapi.client.calendar.events.delete({
        calendarId: this.calendarId,
        eventId: eventId,
      })
      return true
    } catch (error) {
      console.error('Erro ao deletar evento do Google Calendar:', error)
      return false
    }
  }

  async getEvents(
    timeMin?: Date,
    timeMax?: Date
  ): Promise<Appointment[]> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate()
      if (!authenticated) return []
    }

    try {
      const params: any = {
        calendarId: this.calendarId,
        timeMin: (timeMin || new Date()).toISOString(),
        showDeleted: false,
        singleEvents: true,
        orderBy: 'startTime',
      }

      if (timeMax) {
        params.timeMax = timeMax.toISOString()
      }

      const response = await (window as any).gapi.client.calendar.events.list(params)
      const events = response.result.items || []

      return events.map((event: any) => this.convertGoogleEventToAppointment(event))
    } catch (error) {
      console.error('Erro ao buscar eventos do Google Calendar:', error)
      return []
    }
  }

  async syncEvents(startDate: Date, endDate: Date): Promise<Appointment[]> {
    return this.getEvents(startDate, endDate)
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null
  }

  revokeAccess(): void {
    if (this.accessToken) {
      ;(window as any).google.accounts.oauth2.revoke(this.accessToken)
      this.accessToken = null
    }
  }

  openCalendar(): void {
    window.open('https://calendar.google.com', '_blank', 'noopener,noreferrer')
  }
}

export const googleCalendarService = new GoogleCalendarService()
