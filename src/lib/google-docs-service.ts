import { Minuta } from '@/types'
import type { GoogleAuthResponse, TokenClient, GapiGlobal, GoogleGisGlobal, DocsClient, DocsCreateResponse, DocsGetResponse, DocsBatchUpdateResponse, DocumentElement, ParagraphElement } from './google-types'

const GOOGLE_DOCS_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const GOOGLE_DOCS_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || ''
const SCOPES = 'https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive.file'

// local interface removed; using imported `GoogleAuthResponse` from google-types

class GoogleDocsService {
  private tokenClient: TokenClient | null = null
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
      const gapiWindow = window as unknown as { gapi?: GapiGlobal }
      gapiWindow.gapi?.load('client', async () => {
        const clientInit = (gapiWindow.gapi?.client as { init?: (opts: { apiKey: string; discoveryDocs: string[] }) => Promise<void> })?.init
        if (typeof clientInit === 'function') {
          try {
            await clientInit({
              apiKey: GOOGLE_DOCS_API_KEY,
              discoveryDocs: [
                'https://docs.googleapis.com/$discovery/rest?version=v1',
                'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
              ],
            })
            this.gapiInited = true
          } catch (err) {
            console.error('Erro ao inicializar Google API client:', err)
          }
          resolve()
        } else {
          console.error('Google API client init not available')
          resolve()
        }
      })
    })
  }

  private initializeGis(): void {
    const google = (window as unknown as { google?: GoogleGisGlobal })?.google
    if (!google) return

    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_DOCS_CLIENT_ID,
      scope: SCOPES,
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

  async createDocument(minuta: Minuta): Promise<{ docId: string; url: string } | null> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate()
      if (!authenticated) return null
    }

    try {
        const gapiWindow = window as unknown as { gapi?: GapiGlobal }
        const docsApi = (gapiWindow.gapi?.client as { docs?: DocsClient }).docs
        if (!docsApi || typeof docsApi.documents?.create !== 'function') return null
        const createResponse = (await docsApi.documents.create({
          title: minuta.titulo,
        })) as DocsCreateResponse

      const docId = createResponse.result?.documentId
      if (!docId) return null

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

        const gapiWindow = window as unknown as { gapi?: GapiGlobal }
        const docsApi = (gapiWindow.gapi?.client as { docs?: DocsClient }).docs
        if (!docsApi || typeof docsApi.documents?.batchUpdate !== 'function') return false
        await (docsApi.documents.batchUpdate({
          documentId: docId,
          requests: requests,
        }) as Promise<DocsBatchUpdateResponse>)

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
        const gapiWindow = window as unknown as { gapi?: GapiGlobal }
        const docsApi = (gapiWindow.gapi?.client as { docs?: DocsClient }).docs
        if (!docsApi || typeof docsApi.documents?.get !== 'function') return null
        const response = (await docsApi.documents.get({
          documentId: docId,
        })) as DocsGetResponse
      const doc = (response as DocsGetResponse).result
      let text = ''

      if (doc?.body && doc.body.content) {
        doc.body.content.forEach((element: DocumentElement) => {
          if (element.paragraph && element.paragraph.elements) {
            element.paragraph.elements.forEach((paragraphElement: ParagraphElement) => {
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
      const google = (window as unknown as { google?: GoogleGisGlobal })?.google
      try {
        google?.accounts.oauth2.revoke(this.accessToken)
      } catch {
        // ignore non-critical revoke errors
      }
      this.accessToken = null
    }
  }
}

export const googleDocsService = new GoogleDocsService()
