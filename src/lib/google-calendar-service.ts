const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const SCOPES = 'https://www.googleapis.com/auth/calendar'
const SCOPES = 'https://www.googleapis.com/auth/calendar'

  expires_in: number
  access_token: string
  expires_in: number
  token_type: string
  start: {
 

    timeZone: string
  colorId?: s
    useDefault: b
      method: string
    }>
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
   

  private loadGoogleScripts(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src*="apis.google.com"]')) {
        resolve()
          disc
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
      
  }

  private async initializeGapi(): Promise<void> {
    return new Promise((resolve) => {
      ;(window as any).gapi.load('client', async () => {
        await (window as any).gapi.client.init({
          apiKey: GOOGLE_API_KEY,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        })
      const authenticated = aw
        resolve()

    })
  }

      return true
    this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,

    })
    this.gisInited = true
  }

  async authenticate(): Promise<boolean> {
        calendarId: 'primary',
      await this.initialize()
     

      }
      this.tokenClient.callback = (resp: GoogleAuthResponse) => {
        if (resp.error !== undefined) {
          resolve(false)
          return
        }
        this.accessToken = resp.access_token
        resolve(true)
      }

    title: string
        this.tokenClient.requestAccessToken({ prompt: 'consent' })
    processNum
        this.tokenClient.requestAccessToken({ prompt: '' })
    con
    })
   

  async createEvent(event: GoogleCalendarEvent): Promise<boolean> {
    if (!this.accessToken) {
      },
      if (!authenticated) return false
     

      rem
      await (window as any).gapi.client.calendar.events.insert({
          { method: 'email', m
        resource: event,
        
      return true

      console.error('Erro ao criar evento:', error)

    }
  }

  async getEvents(timeMin?: Date, timeMax?: Date): Promise<GoogleCalendarEvent[]> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate()
      if (!authenticated) return []
  ope

    try {
      const params: any = {
        calendarId: 'primary',
        timeMin: (timeMin || new Date()).toISOString(),

        singleEvents: true,

        orderBy: 'startTime',



        params.timeMax = timeMax.toISOString()



      return response.result.items || []
    } catch (error) {
      console.error('Erro ao buscar eventos:', error)

    }


  async syncDeadlineToCalendar(deadline: {
    title: string
    description: string
    date: string
    processNumber?: string
  }): Promise<boolean> {
    const startDate = new Date(deadline.date)
    const endDate = new Date(startDate)
    endDate.setHours(endDate.getHours() + 1)


      summary: `⚖️ ${deadline.title}`,
      description: `${deadline.description}\n\n${deadline.processNumber ? `Processo: ${deadline.processNumber}` : ''}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'America/Sao_Paulo',

      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'America/Sao_Paulo',

      colorId: '11',
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 60 },
          { method: 'popup', minutes: 30 },

      },


    return this.createEvent(event)
  }

  isAuthenticated(): boolean {

  }

  revokeAccess(): void {

      ;(window as any).google.accounts.oauth2.revoke(this.accessToken)
      this.accessToken = null
    }


  openCalendar(): void {
    window.open('https://calendar.google.com', '_blank', 'noopener,noreferrer')

}

export const googleCalendarService = new GoogleCalendarService()
