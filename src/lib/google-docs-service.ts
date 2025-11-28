import type { Minuta } from '@/types'
import type {
  GoogleAuthResponse,
  TokenClient,
  GapiGlobal,
  GoogleGisGlobal,
  DocsClient,
  DocsCreateResponse,
  DocsGetResponse,
  DocsBatchUpdateResponse,
  DocumentElement,
  ParagraphElement,
} from './google-types'

const GOOGLE_DOCS_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const GOOGLE_DOCS_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || ''
const SCOPES =
  'https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive.file'

// Helpers de log (iguais ao padrão do Google Calendar Service)
const debug = (message: string, data?: unknown) => {
  console.log(`[GoogleDocs] ${message}`, data ?? '')
}

const debugError = (message: string, error?: unknown) => {
  console.error(`[GoogleDocs] ERROR: ${message}`, error ?? '')
}

class GoogleDocsService {
  private tokenClient: TokenClient | null = null
  private accessToken: string | null = null
  private gapiInited = false
  private gisInited = false
  private initPromise: Promise<void> | null = null
  private lastError: string | null = null

  getStatus(): {
    configured: boolean
    initialized: boolean
    authenticated: boolean
    lastError: string | null
  } {
    return {
      configured: !!GOOGLE_DOCS_CLIENT_ID && !!GOOGLE_DOCS_API_KEY,
      initialized: this.gapiInited && this.gisInited,
      authenticated: !!this.accessToken,
      lastError: this.lastError,
    }
  }

  async initialize(): Promise<void> {
    debug('Initializing Google Docs Service...')

    // Segurança para SSR / Vercel serverless
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      this.lastError = 'Google Docs Service só pode ser inicializado no browser.'
      debugError(this.lastError)
      return
    }

    if (!GOOGLE_DOCS_CLIENT_ID || !GOOGLE_DOCS_API_KEY) {
      this.lastError =
        'Credenciais do Google Docs não configuradas. Configure VITE_GOOGLE_CLIENT_ID e VITE_GOOGLE_API_KEY.'
      debugError(this.lastError)
      return
    }

    if (this.gapiInited && this.gisInited) {
      debug('Already initialized')
      return
    }

    // Evitar inicializações paralelas
    if (this.initPromise) {
      debug('Waiting for existing initialization...')
      await this.initPromise
      return
    }

    this.initPromise = this._doInitialize()

    try {
      await this.initPromise
    } finally {
      this.initPromise = null
    }
  }

  private async _doInitialize(): Promise<void> {
    try {
      await this.loadGoogleScripts()
      await this.initializeGapi()
      this.initializeGis()
      debug('Initialization complete', {
        gapiInited: this.gapiInited,
        gisInited: this.gisInited,
      })
    } catch (err) {
      this.lastError = `Falha na inicialização: ${
        err instanceof Error ? err.message : String(err)
      }`
      debugError('Initialization failed', err)
    }
  }

  private loadGoogleScripts(): Promise<void> {
    return new Promise((resolve, reject) => {
      debug('Loading Google scripts for Docs...')

      if (typeof window === 'undefined' || typeof document === 'undefined') {
        reject(new Error('Google scripts só podem ser carregados no browser'))
        return
      }

      const gapiWindow = window as unknown as { gapi?: GapiGlobal }
      const googleWindow = window as unknown as { google?: GoogleGisGlobal }

      // Se já tem gapi e google carregados, só segue
      if (gapiWindow.gapi && googleWindow.google) {
        debug('Scripts already loaded')
        resolve()
        return
      }

      // Timeout de 15s
      const timeout = setTimeout(() => {
        reject(new Error('Timeout loading Google scripts (15s)'))
      }, 15000)

      const loadGis = () => {
        if (
          document.querySelector(
            'script[src*="accounts.google.com/gsi/client"]',
          )
        ) {
          debug('GIS script already exists')
          clearTimeout(timeout)
          resolve()
          return
        }

        const gisScript = document.createElement('script')
        gisScript.src = 'https://accounts.google.com/gsi/client'
        gisScript.async = true
        gisScript.defer = true
        gisScript.onload = () => {
          debug('GIS script loaded')
          clearTimeout(timeout)
          resolve()
        }
        gisScript.onerror = () => {
          clearTimeout(timeout)
          reject(
            new Error('Failed to load Google Identity Services script'),
          )
        }
        document.head.appendChild(gisScript)
      }

      if (document.querySelector('script[src*="apis.google.com"]')) {
        debug('GAPI script already exists')
        loadGis()
        return
      }

      const gapiScript = document.createElement('script')
      gapiScript.src = 'https://apis.google.com/js/api.js'
      gapiScript.async = true
      gapiScript.defer = true
      gapiScript.onload = () => {
        debug('GAPI script loaded')
        loadGis()
      }
      gapiScript.onerror = () => {
        clearTimeout(timeout)
        reject(new Error('Failed to load Google API script'))
      }
      document.head.appendChild(gapiScript)
    })
  }

  private async initializeGapi(): Promise<void> {
    return new Promise((resolve, reject) => {
      debug('Initializing GAPI client for Docs...')

      const gapiWindow = window as unknown as { gapi?: GapiGlobal }

      if (!gapiWindow.gapi) {
        this.lastError = 'Google API (gapi) não disponível para Docs'
        debugError(this.lastError)
        reject(new Error(this.lastError))
        return
      }

      gapiWindow.gapi.load('client', async () => {
        debug('GAPI client module loaded (Docs)')

        const clientInit = (
          gapiWindow.gapi?.client as {
            init?: (opts: {
              apiKey: string
              discoveryDocs: string[]
            }) => Promise<void>
          }
        )?.init

        if (typeof clientInit !== 'function') {
          this.lastError = 'Google API client init not available (Docs)'
          debugError(this.lastError)
          reject(new Error(this.lastError))
          return
        }

        try {
          await clientInit({
            apiKey: GOOGLE_DOCS_API_KEY,
            discoveryDocs: [
              'https://docs.googleapis.com/$discovery/rest?version=v1',
              'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
            ],
          })
          this.gapiInited = true
          debug('GAPI client initialized successfully for Docs')
          resolve()
        } catch (err) {
          this.lastError = `Erro ao inicializar Google Docs API: ${
            err instanceof Error ? err.message : String(err)
          }`
          debugError(this.lastError, err)
          reject(err)
        }
      })
    })
  }

  private initializeGis(): void {
    debug('Initializing Google Identity Services for Docs...')

    const google = (window as unknown as { google?: GoogleGisGlobal })?.google
    if (!google?.accounts?.oauth2) {
      this.lastError = 'Google Identity Services não disponível (Docs)'
      debugError(this.lastError)
      return
    }

    try {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_DOCS_CLIENT_ID,
        scope: SCOPES,
        callback: (_resp: GoogleAuthResponse) => {
          // callback real é setado em authenticate()
        },
      })
      this.gisInited = true
      debug('GIS initialized successfully for Docs')
    } catch (err) {
      this.lastError = `Erro ao inicializar GIS (Docs): ${
        err instanceof Error ? err.message : String(err)
      }`
      debugError(this.lastError, err)
    }
  }

  async authenticate(): Promise<boolean> {
    debug('Starting Docs authentication...')

    if (!this.gapiInited || !this.gisInited) {
      await this.initialize()
    }

    if (!this.tokenClient) {
      this.lastError = 'Token client não disponível (Docs)'
      debugError(this.lastError)
      return false
    }

    return new Promise((resolve) => {
      // timeout de 60s para evitar ficar preso se o popup for bloqueado
      const timeout = setTimeout(() => {
        this.lastError =
          'Timeout na autenticação do Docs (60s) - popup pode ter sido bloqueado'
        debugError(this.lastError)
        resolve(false)
      }, 60000)

      this.tokenClient!.callback = (resp: GoogleAuthResponse) => {
        clearTimeout(timeout)

        if (resp.error !== undefined) {
          this.lastError = `Erro de autenticação Docs: ${resp.error}`
          debugError(this.lastError)
          resolve(false)
          return
        }

        this.accessToken = resp.access_token ?? null
        this.lastError = null

        // Conectar token do GIS com gapi.client (igual ao Calendar)
        const gapiWindow = window as unknown as {
          gapi?: GapiGlobal & {
            client?: { setToken?: (token: { access_token: string }) => void }
          }
        }

        if (this.accessToken && gapiWindow.gapi?.client) {
          try {
            ;(gapiWindow.gapi.client as any).setToken?.({
              access_token: this.accessToken,
            })
            debug('gapi client token set from Docs GIS access_token')
          } catch (err) {
            debugError(
              'Failed to set gapi client token for Docs (non-fatal)',
              err,
            )
          }
        }

        debug('Docs authentication successful')
        resolve(true)
      }

      try {
        if (this.accessToken === null) {
          this.tokenClient!.requestAccessToken({ prompt: 'consent' })
        } else {
          this.tokenClient!.requestAccessToken({ prompt: '' })
        }
      } catch (err) {
        clearTimeout(timeout)
        this.lastError = `Erro ao solicitar token Docs: ${
          err instanceof Error ? err.message : String(err)
        }`
        debugError(this.lastError, err)
        resolve(false)
      }
    })
  }

  async createDocument(
    minuta: Minuta,
  ): Promise<{ docId: string; url: string } | null> {
    debug('Creating Docs document from minuta...', { titulo: minuta.titulo })

    if (!this.accessToken) {
      const authenticated = await this.authenticate()
      if (!authenticated) {
        debugError('Cannot create Docs document - not authenticated')
        return null
      }
    }

    try {
      const gapiWindow = window as unknown as { gapi?: GapiGlobal }
      const docsApi = (gapiWindow.gapi?.client as { docs?: DocsClient }).docs

      if (!docsApi || typeof docsApi.documents?.create !== 'function') {
        this.lastError = 'Docs API create não disponível'
        debugError(this.lastError)
        return null
      }

      const createResponse = (await docsApi.documents.create({
        title: minuta.titulo,
      })) as DocsCreateResponse

      const docId = createResponse.result?.documentId
      if (!docId) {
        this.lastError = 'Docs API não retornou documentId'
        debugError(this.lastError, createResponse)
        return null
      }

      const updated = await this.updateDocumentContent(docId, minuta.conteudo)

      if (!updated) {
        // documento foi criado, mas não conseguimos escrever — ainda retornamos ID/URL pro usuário corrigir manualmente
        debugError('Documento criado mas falha ao atualizar conteúdo')
      }

      const url = `https://docs.google.com/document/d/${docId}/edit`
      debug('Docs document created successfully', { docId, url })

      return { docId, url }
    } catch (error) {
      this.lastError = `Erro ao criar documento Docs: ${
        error instanceof Error ? error.message : String(error)
      }`
      debugError(this.lastError, error)
      return null
    }
  }

  async updateDocumentContent(docId: string, content: string): Promise<boolean> {
    debug('Updating Docs document content...', { docId })

    if (!this.accessToken) {
      const authenticated = await this.authenticate()
      if (!authenticated) {
        debugError('Cannot update Docs content - not authenticated')
        return false
      }
    }

    try {
      const gapiWindow = window as unknown as { gapi?: GapiGlobal }
      const docsApi = (gapiWindow.gapi?.client as { docs?: DocsClient }).docs

      if (!docsApi || typeof docsApi.documents?.batchUpdate !== 'function') {
        this.lastError = 'Docs API batchUpdate não disponível'
        debugError(this.lastError)
        return false
      }

      // Estratégia simples: insere o conteúdo a partir do index 1
      // (para algo mais avançado, poderíamos limpar o conteúdo antes)
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

      await (docsApi.documents.batchUpdate({
        documentId: docId,
        requests,
      }) as Promise<DocsBatchUpdateResponse>)

      debug('Docs document content updated successfully')
      return true
    } catch (error) {
      this.lastError = `Erro ao atualizar conteúdo do Docs: ${
        error instanceof Error ? error.message : String(error)
      }`
      debugError(this.lastError, error)
      return false
    }
  }

  async getDocumentContent(docId: string): Promise<string | null> {
    debug('Fetching Docs document content...', { docId })

    if (!this.accessToken) {
      const authenticated = await this.authenticate()
      if (!authenticated) {
        debugError('Cannot get Docs content - not authenticated')
        return null
      }
    }

    try {
      const gapiWindow = window as unknown as { gapi?: GapiGlobal }
      const docsApi = (gapiWindow.gapi?.client as { docs?: DocsClient }).docs

      if (!docsApi || typeof docsApi.documents?.get !== 'function') {
        this.lastError = 'Docs API get não disponível'
        debugError(this.lastError)
        return null
      }

      const response = (await docsApi.documents.get({
        documentId: docId,
      })) as DocsGetResponse

      const doc = response.result
      let text = ''

      if (doc?.body?.content) {
        doc.body.content.forEach((element: DocumentElement) => {
          if (element.paragraph?.elements) {
            element.paragraph.elements.forEach(
              (paragraphElement: ParagraphElement) => {
                if (paragraphElement.textRun?.content) {
                  text += paragraphElement.textRun.content
                }
              },
            )
          }
        })
      }

      debug('Docs document content fetched successfully', {
        length: text.length,
      })
      return text
    } catch (error) {
      this.lastError = `Erro ao buscar conteúdo do Docs: ${
        error instanceof Error ? error.message : String(error)
      }`
      debugError(this.lastError, error)
      return null
    }
  }

  async syncDocument(docId: string): Promise<string | null> {
    return this.getDocumentContent(docId)
  }

  openDocument(url: string): void {
    if (typeof window === 'undefined') return
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null
  }

  isConfigured(): boolean {
    return !!GOOGLE_DOCS_CLIENT_ID && !!GOOGLE_DOCS_API_KEY
  }

  getLastError(): string | null {
    return this.lastError
  }

  clearError(): void {
    this.lastError = null
  }

  revokeAccess(): void {
    debug('Revoking Docs access...')
    if (this.accessToken) {
      const google = (window as unknown as { google?: GoogleGisGlobal })?.google
      try {
        google?.accounts.oauth2.revoke(this.accessToken)
        debug('Docs access revoked')
      } catch {
        // erro de revoke não é crítico
      }
      this.accessToken = null
    }
  }
}

export const googleDocsService = new GoogleDocsService()
