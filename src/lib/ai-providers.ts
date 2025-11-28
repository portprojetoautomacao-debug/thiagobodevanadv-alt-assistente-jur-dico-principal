/**
 * Multi-Provider AI Integration
 *
 * Provedores suportados:
 * - Gemini 2.5 Pro (principal)
 * - Azure OpenAI (quando assinatura ativa)
 * - Hugging Face Inference API (free tier)
 * - GitHub Models (free com conta GitHub)
 */

// ============================================================================
// CONFIG TYPES
// ============================================================================

export interface AIModelConfig {
  provider: 'gemini' | 'azure' | 'huggingface' | 'github'
  model: string
  apiKey?: string
  endpoint?: string
}

// Azure AI Configuration (quando assinatura ativa)
export const AZURE_AI_CONFIG = {
  endpoint: 'https://thiagobodevanveiga-1800-resource.cognitiveservices.azure.com/',
  resourceGroup: 'rg-thiagobodevanveiga-1800',
  resourceName: 'thiagobodevanveiga-1800-resource',
  deployments: {
    // alias → deployment name
    'gpt-4': 'gpt-4.1',
    embedding: 'text-embedding-3-small'
  }
}

// Hugging Face Configuration (free tier)
export const HUGGINGFACE_CONFIG = {
  baseUrl: 'https://api-inference.huggingface.co/models',
  models: {
    'qwen-7b': 'Qwen/Qwen2.5-7B-Instruct',
    'qwen-1.5b': 'Qwen/Qwen2.5-1.5B-Instruct',
    'phi-3': 'microsoft/Phi-3-mini-4k-instruct',
    'mistral-7b': 'mistralai/Mistral-7B-Instruct-v0.3',
    'llama-8b': 'meta-llama/Llama-3.1-8B-Instruct'
  }
}

// GitHub Models Configuration (free com GitHub)
export const GITHUB_MODELS_CONFIG = {
  baseUrl: 'https://models.inference.ai.azure.com',
  models: {
    'gpt-4o': 'gpt-4o',
    'gpt-4o-mini': 'gpt-4o-mini',
    'phi-3': 'Phi-3-mini-4k-instruct',
    'llama-8b': 'Meta-Llama-3.1-8B-Instruct'
  }
}

// ============================================================================
// GEMINI CLIENT (PRINCIPAL)
// ============================================================================

/**
 * Gemini Client — usa Gemini 2.5 Pro como modelo principal
 *
 * Observação importante:
 * - Idealmente o acesso à API Gemini deve ficar no backend
 * - Aqui usamos import.meta.env para pegar a key em ambiente bundlado (Vite/Spark)
 */
export class GeminiClient {
  private apiKey: string | null
  private baseUrl = 'https://generativelanguage.googleapis.com/v1/models'

  constructor(apiKey?: string) {
    // Tenta pegar API key de forma flexível
    this.apiKey =
      apiKey ||
      (typeof import.meta !== 'undefined'
        ? (import.meta.env.VITE_GOOGLE_API_KEY ||
          import.meta.env.VITE_GEMINI_API_KEY ||
          import.meta.env.VITE_GEMINI_API_KEY_BACKEND ||
          '')
        : '') ||
      null
  }

  isConfigured(): boolean {
    return !!this.apiKey
  }

  /**
   * Chat com Gemini (default: gemini-2.5-pro)
   */
  async chat(
    model: string,
    messages: Array<{ role: string; content: string }>,
    options: { maxTokens?: number; temperature?: number } = {}
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key não configurada (VITE_GOOGLE_API_KEY / VITE_GEMINI_API_KEY).')
    }

    const modelId = model || 'gemini-2.5-pro'

    // Converte mensagens estilo OpenAI para um prompt único
    const prompt = messages
      .map(m => {
        if (m.role === 'system') return `# Sistema\n${m.content}`
        if (m.role === 'user') return `# Usuário\n${m.content}`
        return `# Assistente\n${m.content}`
      })
      .join('\n\n')

    const url = `${this.baseUrl}/${modelId}:generateContent?key=${encodeURIComponent(this.apiKey)}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          maxOutputTokens: options.maxTokens || 1024,
          temperature: options.temperature ?? 0.7
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} ${errorText}`)
    }

    const data = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }

    const parts = data.candidates?.[0]?.content?.parts || []
    const text = parts.map(p => p.text || '').join('\n').trim()

    return text
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false
    try {
      const url = `${this.baseUrl}/gemini-2.5-pro:generateContent?key=${encodeURIComponent(this.apiKey)}`
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
          generationConfig: { maxOutputTokens: 1, temperature: 0 }
        })
      })
      return resp.ok
    } catch {
      return false
    }
  }
}

// ============================================================================
// HUGGING FACE CLIENT
// ============================================================================

/**
 * Hugging Face Inference Client
 * Free tier: ~30k tokens/mês
 */
export class HuggingFaceClient {
  private apiKey: string | null
  private baseUrl = HUGGINGFACE_CONFIG.baseUrl

  constructor(apiKey?: string) {
    this.apiKey =
      apiKey ||
      (typeof import.meta !== 'undefined'
        ? import.meta.env.VITE_HUGGINGFACE_API_KEY || ''
        : '') ||
      null
  }

  async chat(
    model: string,
    messages: Array<{ role: string; content: string }>,
    options: { maxTokens?: number; temperature?: number } = {}
  ): Promise<string> {
    const modelId =
      HUGGINGFACE_CONFIG.models[model as keyof typeof HUGGINGFACE_CONFIG.models] || model

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`
    }

    const prompt =
      messages
        .map(m => {
          if (m.role === 'system') return `<|system|>\n${m.content}`
          if (m.role === 'user') return `<|user|>\n${m.content}`
          return `<|assistant|>\n${m.content}`
        })
        .join('\n') + '\n<|assistant|>\n'

    const response = await fetch(`${this.baseUrl}/${modelId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: options.maxTokens || 1024,
          temperature: options.temperature ?? 0.7,
          return_full_text: false
        }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`HuggingFace API error: ${error}`)
    }

    const result = await response.json()

    if (Array.isArray(result)) {
      return result[0]?.generated_text || ''
    }

    return result.generated_text || ''
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/microsoft/Phi-3-mini-4k-instruct`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs: 'Hi', parameters: { max_new_tokens: 1 } })
        }
      )
      // 503 = modelo carregando, mas endpoint existe
      return response.ok || response.status === 503
    } catch {
      return false
    }
  }
}

// ============================================================================
// GITHUB MODELS CLIENT
// ============================================================================

/**
 * GitHub Models Client
 * Free com conta GitHub
 */
export class GitHubModelsClient {
  private apiKey: string
  private baseUrl = GITHUB_MODELS_CONFIG.baseUrl

  constructor(apiKey?: string) {
    this.apiKey =
      apiKey ||
      (typeof import.meta !== 'undefined'
        ? import.meta.env.VITE_GITHUB_TOKEN || ''
        : '') ||
      ''
  }

  async chat(
    model: string,
    messages: Array<{ role: string; content: string }>,
    options: { maxTokens?: number; temperature?: number } = {}
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GitHub Models token ausente (VITE_GITHUB_TOKEN)')
    }

    const modelId =
      GITHUB_MODELS_CONFIG.models[model as keyof typeof GITHUB_MODELS_CONFIG.models] || model

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        max_tokens: options.maxTokens || 1024,
        temperature: options.temperature ?? 0.7
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`GitHub Models API error: ${error}`)
    }

    const result = await response.json()
    return result.choices?.[0]?.message?.content || ''
  }
}

// ============================================================================
// AZURE OPENAI CLIENT
// ============================================================================

/**
 * Azure OpenAI Client
 * Requer assinatura Azure ativa
 */
export class AzureOpenAIClient {
  private endpoint: string
  private apiKey: string
  private apiVersion = '2024-02-15-preview'

  constructor(endpoint?: string, apiKey?: string) {
    this.endpoint = endpoint || AZURE_AI_CONFIG.endpoint
    this.apiKey =
      apiKey ||
      (typeof import.meta !== 'undefined'
        ? import.meta.env.VITE_AZURE_OPENAI_KEY || ''
        : '') ||
      ''
  }

  /**
   * deploymentOrAlias:
   * - 'gpt-4', 'embedding', etc. → mapeia via AZURE_AI_CONFIG.deployments
   * - se não houver alias, usa valor bruto como nome do deployment
   */
  async chat(
    deploymentOrAlias: string,
    messages: Array<{ role: string; content: string }>,
    options: { maxTokens?: number; temperature?: number } = {}
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Azure OpenAI API key não configurada (VITE_AZURE_OPENAI_KEY)')
    }

    const deployments = AZURE_AI_CONFIG.deployments
    const deployment =
      deployments[deploymentOrAlias as keyof typeof deployments] || deploymentOrAlias

    const url = `${this.endpoint}openai/deployments/${deployment}/chat/completions?api-version=${this.apiVersion}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey
      },
      body: JSON.stringify({
        messages,
        max_tokens: options.maxTokens || 1024,
        temperature: options.temperature ?? 0.7
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Azure OpenAI API error: ${error}`)
    }

    const result = await response.json()
    return result.choices?.[0]?.message?.content || ''
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false

    try {
      const response = await fetch(
        `${this.endpoint}openai/models?api-version=${this.apiVersion}`,
        {
          headers: { 'api-key': this.apiKey }
        }
      )
      return response.ok
    } catch {
      return false
    }
  }
}

// ============================================================================
// UNIFIED AI CLIENT (GEMINI FIRST)
// ============================================================================

/**
 * UnifiedAIClient
 *
 * - Provedor principal: Gemini (gemini-2.5-pro)
 * - Fallbacks: GitHub → HuggingFace → Azure
 *
 * Uso:
 *   const { content, provider, model } = await aiClient.chat(messages, {
 *     provider: 'gemini' | 'github' | 'huggingface' | 'azure',
 *     model: 'gemini-2.5-pro' | 'gpt-4o' | ...
 *   })
 */
export class UnifiedAIClient {
  private gemini: GeminiClient
  private huggingface: HuggingFaceClient
  private github: GitHubModelsClient
  private azure: AzureOpenAIClient
  private preferredProvider: AIModelConfig['provider'] = 'gemini'

  constructor() {
    this.gemini = new GeminiClient()
    this.huggingface = new HuggingFaceClient()
    this.github = new GitHubModelsClient()
    this.azure = new AzureOpenAIClient()
  }

  setPreferredProvider(provider: AIModelConfig['provider']) {
    this.preferredProvider = provider
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    options: {
      model?: string
      provider?: AIModelConfig['provider']
      maxTokens?: number
      temperature?: number
    } = {}
  ): Promise<{ content: string; provider: string; model: string }> {
    const requested = options.provider || this.preferredProvider

    // Monta lista de provedores, sem duplicatas, na ordem de preferência:
    // pedido → gemini → github → huggingface → azure
    const rawOrder: AIModelConfig['provider'][] = [
      requested,
      'gemini',
      'github',
      'huggingface',
      'azure'
    ]

    const providers: AIModelConfig['provider'][] = []
    for (const p of rawOrder) {
      if (!providers.includes(p)) providers.push(p)
    }

    for (const p of providers) {
      try {
        let content: string
        let model: string

        switch (p) {
          case 'gemini': {
            model = options.model || 'gemini-2.5-pro'
            content = await this.gemini.chat(model, messages, options)
            return { content, provider: 'gemini', model }
          }

          case 'github': {
            model = options.model || 'gpt-4o-mini'
            content = await this.github.chat(model, messages, options)
            return { content, provider: 'github', model }
          }

          case 'huggingface': {
            model = options.model || 'phi-3'
            content = await this.huggingface.chat(model, messages, options)
            return { content, provider: 'huggingface', model }
          }

          case 'azure': {
            if (await this.azure.isAvailable()) {
              // Usa alias lógico, mapeado dentro do AzureOpenAIClient
              model = options.model || 'gpt-4'
              content = await this.azure.chat(model, messages, options)
              return { content, provider: 'azure', model }
            }
            continue
          }

          default:
            continue
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(`Provider ${p} failed:`, error)
        continue
      }
    }

    throw new Error('All AI providers failed')
  }

  async getAvailableProviders(): Promise<string[]> {
    const available: string[] = []

    if (await this.gemini.isAvailable()) {
      available.push('gemini')
    }

    if (await this.huggingface.isAvailable()) {
      available.push('huggingface')
    }

    if (
      typeof import.meta !== 'undefined' &&
      !!import.meta.env.VITE_GITHUB_TOKEN
    ) {
      available.push('github')
    }

    if (await this.azure.isAvailable()) {
      available.push('azure')
    }

    return available
  }
}

// Singleton para uso direto no app
export const aiClient = new UnifiedAIClient()
