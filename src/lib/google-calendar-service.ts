import { Appointment } from '@/types'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || ''
  expires_in: number


  access_token: string
  start: {
    timeZone: string
  end: {
}

    useDefault: boolean
      method: str
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
   


    if (!this.gapiInited || !this.gisInited) 
    }
    return new Pr
        if (re
       

      }
      if (this.accessToken === null) {
      } else {
      }
  }
  async createEvent(appointment: Appointment): Promise<str
      const authenticated = await this.authenticate()
    }
    try {
      const endDateTime = new Date(startDa
      const event: CalendarEvent =
        description: appointment.description
       
        },
          dateTime: endDateTime.toISOString
      
   

          })) || [
          ],
      }
      const response = await (window as any).gap
        resource: event,

    } catch (error) {
      return
  }
  async updateEvent(eventId: s
      const authe
    }
    tr
   

        description: appointment.
          dateTime: startDateTime.toISOString(),
        },
          dateTime: 
        },
      
            method: 'popu
   

      }
      await (window as any).gapi.client.calend
        eventId: eventId,
    }

      console.error('Erro ao atualiza
    }

    if (!this.accessToke
      if (!authe

      await (window as any).gapi.client.cale
        eventId: even
      }

      if (this.accessToken === null) {
  }
      } else {
  }
      }
      
  }

export const googleCalendarService = new GoogleCalendarService()

      const authenticated = await this.authenticate()

    }

    try {









        },









          })) || [

          ],

      }



        resource: event,



    } catch (error) {



  }





    }









          dateTime: startDateTime.toISOString(),

        },



        },









      }



        eventId: eventId,







    }

















      return false

  }



  }









export const googleCalendarService = new GoogleCalendarService()
