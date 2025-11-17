// Google Calendar Service
// Provides integration with Google Calendar API

import { Appointment } from '@/types'
import type { GoogleAuthResponse, TokenClient, GapiGlobal, GoogleGisGlobal, CalendarClient } from './google-types'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || ''
const CALENDAR_SCOPES = 'https://www.googleapis.com/auth/calendar.events'


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

class GoogleCalendarService {
  private tokenClient: TokenClient | null = null
  private accessToken: string | null = null
  private gapiInited = false
  private gisInited = false

  async initialize(): Promise<void> {
    if (this.gapiInited && this.gisInited) {
      return
    }

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
      const gapiWindow = window as unknown as { gapi?: GapiGlobal }
      gapiWindow.gapi?.load('client', async () => {
        // we need to call init on client; caller provides API key & discovery docs
        // keep a minimal `any` at the call site to avoid disabling rule for entire file
        const clientInit = (gapiWindow.gapi?.client as { init?: (opts: { apiKey: string; discoveryDocs: string[] }) => Promise<void> })?.init
        if (typeof clientInit === 'function') {
          await clientInit({
            apiKey: GOOGLE_API_KEY,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
          })
        }
        this.gapiInited = true
        resolve()
      })
    })
  }

  private initializeGis(): void {
    const google = (window as unknown as { google?: GoogleGisGlobal })?.google
    if (!google) return

    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: CALENDAR_SCOPES,
      callback: (_resp: GoogleAuthResponse) => {},
    })
    this.gisInited = true
  }

  async authenticate(): Promise<boolean> {
    if (!this.gapiInited || !this.gisInited) {
      await this.initialize()
    }

    return new Promise((resolve) => {
      if (!this.tokenClient) {
        resolve(false)
        return
      }
      this.tokenClient.callback = (resp: GoogleAuthResponse) => {
        if (resp.error !== undefined) {
          resolve(false)
          return
        }
        this.accessToken = resp.access_token ?? null
        resolve(true)
      }

      if (this.accessToken === null) {
        this.tokenClient.requestAccessToken({ prompt: 'consent' })
      } else {
        this.tokenClient.requestAccessToken({ prompt: '' })
      }
    })
  }

  async listEvents(timeMin?: Date, timeMax?: Date): Promise<GoogleCalendarEvent[]> {
    try {
      const params: Record<string, unknown> = {
        calendarId: 'primary',
        timeMin: (timeMin || new Date()).toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 100,
        orderBy: 'startTime',
      }

      if (timeMax) {
        params.timeMax = timeMax.toISOString()
      }

      const gapiWindow = window as unknown as { gapi?: GapiGlobal }
      const eventsApi = (gapiWindow.gapi?.client as { calendar?: CalendarClient }).calendar?.events
      if (!eventsApi || typeof eventsApi.list !== 'function') return []
      const response = (await eventsApi.list(params)) as unknown as { result?: { items?: GoogleCalendarEvent[] } }
      return response.result?.items || []
    } catch (error) {
      console.error('Error fetching calendar events:', error)
      return []
    }
  }

  async createEvent(appointment: Appointment): Promise<string | null> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate()
      if (!authenticated) return null
    }

    try {
      const startDateTime = new Date(`${appointment.date}T${appointment.time}`)
      const endDateTime = new Date(startDateTime.getTime() + appointment.duration * 60000)

      const event: GoogleCalendarEvent = {
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
        reminders: {
          useDefault: false,
          overrides: (appointment.reminders || []).map((minutes) => ({
            method: 'popup',
            minutes,
          })),
        },
      }

      const gapiWindow = window as unknown as { gapi?: GapiGlobal }
      const eventsApi = (gapiWindow.gapi?.client as { calendar?: CalendarClient }).calendar?.events
      if (!eventsApi || typeof eventsApi.insert !== 'function') return null
      const response = (await eventsApi.insert({
        calendarId: 'primary',
        resource: event,
      })) as unknown as { result?: { id?: string } }
      return response.result?.id ?? null
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

      const event: GoogleCalendarEvent = {
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
        reminders: {
          useDefault: false,
          overrides: (appointment.reminders || []).map((minutes) => ({
            method: 'popup',
            minutes,
          })),
        },
      }

      const gapiWindow = window as unknown as { gapi?: GapiGlobal }
      const eventsApi = (gapiWindow.gapi?.client as { calendar?: CalendarClient }).calendar?.events
      if (!eventsApi || typeof eventsApi.update !== 'function') return false
      await eventsApi.update({
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
      const gapiWindow = window as unknown as { gapi?: GapiGlobal }
      const eventsApi = (gapiWindow.gapi?.client as { calendar?: CalendarClient }).calendar?.events
      if (!eventsApi || typeof eventsApi.delete !== 'function') return false
      await eventsApi.delete({
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
      const google = (window as unknown as { google?: GoogleGisGlobal })?.google
      try {
        google?.accounts.oauth2.revoke(this.accessToken)
      } catch {
        // ignore non-critical revoke errors
      }
      this.accessToken = null
    }
  }

  openGoogleCalendar(): void {
    window.open('https://calendar.google.com', '_blank')
  }

  logout(): void {
    this.accessToken = null
  }
}

export const googleCalendarService = new GoogleCalendarService()
export type { GoogleCalendarEvent }
