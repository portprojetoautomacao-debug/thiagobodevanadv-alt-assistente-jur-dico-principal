import { Appointment } from '@/types'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || ''
const SCOPES = 'https://www.googleapis.com/auth/calendar'

interface GoogleAuthResponse {
  access_token: string
  expires_in: number
  token_type: string
  error?: string
}

interface CalendarEvent {
  summary: string
  description?: string
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

class GoogleCalendarService {
  private tokenClient: any = null
  private accessToken: string | null = null
  private gapiInited = false
  private gisInited = false

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
          discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
          ],
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

  async createEvent(appointment: Appointment): Promise<string | null> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate()
      if (!authenticated) return null
    }

    try {
      const startDateTime = new Date(`${appointment.date}T${appointment.time}`)
      const endDateTime = new Date(startDateTime.getTime() + appointment.duration * 60000)

      const event: CalendarEvent = {
        summary: appointment.title,
        description: appointment.description || '',
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        reminders: {
          useDefault: false,
          overrides: appointment.reminders?.map(minutes => ({
            method: 'popup',
            minutes: minutes,
          })) || [
            { method: 'popup', minutes: 30 },
          ],
        },
      }

      const response = await (window as any).gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      })

      return response.result.id
    } catch (error) {
      console.error('Erro ao criar evento:', error)
      return null
    }
  }

  async updateEvent(eventId: string, appointment: Appointment): Promise<boolean> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate()
      if (!authenticated) return false
    }

    try {
      const startDateTime = new Date(`${appointment.date}T${appointment.time}`)
      const endDateTime = new Date(startDateTime.getTime() + appointment.duration * 60000)

      const event: CalendarEvent = {
        summary: appointment.title,
        description: appointment.description || '',
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        reminders: {
          useDefault: false,
          overrides: appointment.reminders?.map(minutes => ({
            method: 'popup',
            minutes: minutes,
          })) || [
            { method: 'popup', minutes: 30 },
          ],
        },
      }

      await (window as any).gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event,
      })

      return true
    } catch (error) {
      console.error('Erro ao atualizar evento:', error)
      return false
    }
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate()
      if (!authenticated) return false
    }

    try {
      await (window as any).gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      })

      return true
    } catch (error) {
      console.error('Erro ao deletar evento:', error)
      return false
    }
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
}

export const googleCalendarService = new GoogleCalendarService()
