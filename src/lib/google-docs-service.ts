import { Minuta } from '@/types'

const GOOGLE_DOCS_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const GOOGLE_DOCS_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || ''
const SCOPES = 'https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive.file'

interface GoogleAuthResponse {
  access_token: string
  expires_in: number
  token_type: string
  error?: string
}

class GoogleDocsService {
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
          apiKey: GOOGLE_DOCS_API_KEY,
          discoveryDocs: [
            'https://docs.googleapis.com/$discovery/rest?version=v1',
            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
          ],
        })
        this.gapiInited = true
        resolve()
      })
    })
  }

  private initializeGis(): void {
    this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_DOCS_CLIENT_ID,
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

  async createDocument(minuta: Minuta): Promise<{ docId: string; url: string } | null> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate()
      if (!authenticated) return null
    }

    try {
      const createResponse = await (window as any).gapi.client.docs.documents.create({
        title: minuta.titulo,
      })

      const docId = createResponse.result.documentId

      await this.updateDocumentContent(docId, minuta.conteudo)

      const url = `https://docs.google.com/document/d/${docId}/edit`

      return { docId, url }
    } catch (error) {
      console.error('Erro ao criar documento:', error)
      return null
    }
  }

  async updateDocumentContent(docId: string, content: string): Promise<boolean> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate()
      if (!authenticated) return false
    }

    try {
      const requests = [
        {
          insertText: {
            location: {
              index: 1,
            },
            text: content,
          },
        },
      ]

      await (window as any).gapi.client.docs.documents.batchUpdate({
        documentId: docId,
        requests: requests,
      })

      return true
    } catch (error) {
      console.error('Erro ao atualizar documento:', error)
      return false
    }
  }

  async getDocumentContent(docId: string): Promise<string | null> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate()
      if (!authenticated) return null
    }

    try {
      const response = await (window as any).gapi.client.docs.documents.get({
        documentId: docId,
      })

      const doc = response.result
      let text = ''

      if (doc.body && doc.body.content) {
        doc.body.content.forEach((element: any) => {
          if (element.paragraph && element.paragraph.elements) {
            element.paragraph.elements.forEach((paragraphElement: any) => {
              if (paragraphElement.textRun && paragraphElement.textRun.content) {
                text += paragraphElement.textRun.content
              }
            })
          }
        })
      }

      return text
    } catch (error) {
      console.error('Erro ao buscar conteúdo do documento:', error)
      return null
    }
  }

  async syncDocument(docId: string): Promise<string | null> {
    return this.getDocumentContent(docId)
  }

  openDocument(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer')
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

export const googleDocsService = new GoogleDocsService()
