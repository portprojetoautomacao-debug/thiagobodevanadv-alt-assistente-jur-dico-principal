import { Appointment } from '@/types'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || ''
  expires_in: number


  id?: string
  expires_in: number
  start: {
    timeZone: st
}

  colorId?: string
    useDefaul
      method: str
  description?: string
  location?: string
  start: {
    dateTime: string
    timeZone: string
cla
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

  }
 

        gisScript.async =
        gisScrip
        documen
      gapiScript
    })


        await (window as any)
          discoveryDocs: ['https:
        this.gapiInited = true
      })
  }
  private initializeGis(): void 

      callback: '',
    this.gisInited = true

    if (!this.gapiInited || !this.
    }
    return new Promise((
   

        this.accessToken = resp.access_token
      }
      if (this.accessToken === null) {
      } else {
      }
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
        timeMin: (timeMin || new Date()).toISOString(),

      }
      if (timeMax) {
      }
      const response = await (window as any

    } catch (error) {
      return []
  }
  async sync
  }
  isAuthenticated(): boolean {
  }
  revokeAccess(): void {
      ;(window as 
    }

    window.open('https://calendar.google.com', '
}
export con













































































































        timeMin: (timeMin || new Date()).toISOString(),



      }

      if (timeMax) {

      }





    } catch (error) {

      return []

  }



  }

  isAuthenticated(): boolean {

  }

  revokeAccess(): void {



    }





}


