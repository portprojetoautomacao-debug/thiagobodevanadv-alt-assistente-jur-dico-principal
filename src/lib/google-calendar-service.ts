// Google Calendar Service
// Provides integration with Google Calendar API

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || ''
const SCOPES = 'https://www.googleapis.com/auth/calendar'

interface GoogleAuthResponse {
  access_token: string
  expires_in: number
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

class GoogleCalendarService {
  private tokenClient: any = null
  private accessToken: string | null = null
  private gapiInited = false
  private gisInited = false

  async initialize(): Promise<void> {
    if (this.gapiInited && this.gisInited) {
      return
    }

    await this.loadScripts()
    await this.initializeGapi()
    this.initializeGis()
  }

  private loadScripts(): Promise<void> {
    return new Promise((resolve, reject) => {
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

  async listEvents(timeMin?: Date, timeMax?: Date): Promise<GoogleCalendarEvent[]> {
    try {
      const params: any = {
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

      const response = await (window as any).gapi.client.calendar.events.list(params)
      return response.result.items || []
    } catch (error) {
      console.error('Error fetching calendar events:', error)
      return []
    }
  }

  async createEvent(event: GoogleCalendarEvent): Promise<GoogleCalendarEvent | null> {
    try {
      const response = await (window as any).gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      })
      return response.result
    } catch (error) {
      console.error('Error creating calendar event:', error)
      return null
    }
  }

  async updateEvent(eventId: string, event: GoogleCalendarEvent): Promise<GoogleCalendarEvent | null> {
    try {
      const response = await (window as any).gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event,
      })
      return response.result
    } catch (error) {
      console.error('Error updating calendar event:', error)
      return null
    }
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      await (window as any).gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      })
      return true
    } catch (error) {
      console.error('Error deleting calendar event:', error)
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

  openGoogleCalendar(): void {
    window.open('https://calendar.google.com', '_blank')
  }
}

export const googleCalendarService = new GoogleCalendarService()
export type { GoogleCalendarEvent }
