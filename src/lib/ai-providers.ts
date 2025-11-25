/**
 * Azure AI / Hugging Face Model Integration
 * 
 * Provides unified access to AI models via:
 * - Azure AI Services (when subscription is active)
 * - Hugging Face Inference API (free tier available)
 * - GitHub Models (free with GitHub account)
 */

// Configuration for different providers
export interface AIModelConfig {
  provider: 'azure' | 'huggingface' | 'github' | 'spark'
  model: string
  apiKey?: string
  endpoint?: string
}

// Azure AI Configuration (when subscription is active)
export const AZURE_AI_CONFIG = {
  endpoint: 'https://thiagobodevanveiga-1800-resource.cognitiveservices.azure.com/',
  resourceGroup: 'rg-thiagobodevanveiga-1800',
  resourceName: 'thiagobodevanveiga-1800-resource',
  deployments: {
    'gpt-4': 'gpt-4.1',
    'embedding': 'text-embedding-3-small'
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

// GitHub Models Configuration (free with GitHub account)
export const GITHUB_MODELS_CONFIG = {
  baseUrl: 'https://models.inference.ai.azure.com',
  models: {
    'gpt-4o': 'gpt-4o',
    'gpt-4o-mini': 'gpt-4o-mini',
    'phi-3': 'Phi-3-mini-4k-instruct',
    'llama-8b': 'Meta-Llama-3.1-8B-Instruct'
  }
}

/**
 * Hugging Face Inference Client
 * Free tier: ~30k tokens/month
 */
export class HuggingFaceClient {
  private apiKey: string | null
  private baseUrl = HUGGINGFACE_CONFIG.baseUrl

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_HUGGINGFACE_API_KEY || null
  }

  async chat(
    model: string,
    messages: Array<{ role: string; content: string }>,
    options: { maxTokens?: number; temperature?: number } = {}
  ): Promise<string> {
    const modelId = HUGGINGFACE_CONFIG.models[model as keyof typeof HUGGINGFACE_CONFIG.models] || model

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    // Format messages for instruction models
    const prompt = messages
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
          temperature: options.temperature || 0.7,
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
      const response = await fetch(`${this.baseUrl}/microsoft/Phi-3-mini-4k-instruct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: 'Hi', parameters: { max_new_tokens: 1 } })
      })
      return response.ok || response.status === 503 // 503 = model loading, still available
    } catch {
      return false
    }
  }
}

/**
 * GitHub Models Client
 * Free with GitHub account
 */
export class GitHubModelsClient {
  private apiKey: string
  private baseUrl = GITHUB_MODELS_CONFIG.baseUrl

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_GITHUB_TOKEN || ''
  }

  async chat(
    model: string,
    messages: Array<{ role: string; content: string }>,
    options: { maxTokens?: number; temperature?: number } = {}
  ): Promise<string> {
    const modelId = GITHUB_MODELS_CONFIG.models[model as keyof typeof GITHUB_MODELS_CONFIG.models] || model

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        max_tokens: options.maxTokens || 1024,
        temperature: options.temperature || 0.7
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

/**
 * Azure OpenAI Client
 * Requires active Azure subscription
 */
export class AzureOpenAIClient {
  private endpoint: string
  private apiKey: string
  private apiVersion = '2024-02-15-preview'

  constructor(endpoint?: string, apiKey?: string) {
    this.endpoint = endpoint || AZURE_AI_CONFIG.endpoint
    this.apiKey = apiKey || import.meta.env.VITE_AZURE_OPENAI_KEY || ''
  }

  async chat(
    deployment: string,
    messages: Array<{ role: string; content: string }>,
    options: { maxTokens?: number; temperature?: number } = {}
  ): Promise<string> {
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
        temperature: options.temperature || 0.7
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
      const response = await fetch(`${this.endpoint}openai/models?api-version=${this.apiVersion}`, {
        headers: { 'api-key': this.apiKey }
      })
      return response.ok
    } catch {
      return false
    }
  }
}

/**
 * Unified AI Client - Auto-selects best available provider
 */
export class UnifiedAIClient {
  private huggingface: HuggingFaceClient
  private github: GitHubModelsClient
  private azure: AzureOpenAIClient
  private preferredProvider: AIModelConfig['provider'] = 'spark'

  constructor() {
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
    const provider = options.provider || this.preferredProvider

    // Try providers in order of preference
    const providers: AIModelConfig['provider'][] = [provider, 'github', 'huggingface', 'azure']
    
    for (const p of providers) {
      try {
        let content: string
        let model: string

        switch (p) {
          case 'huggingface':
            model = options.model || 'phi-3'
            content = await this.huggingface.chat(model, messages, options)
            return { content, provider: 'huggingface', model }

          case 'github':
            model = options.model || 'gpt-4o-mini'
            content = await this.github.chat(model, messages, options)
            return { content, provider: 'github', model }

          case 'azure':
            if (await this.azure.isAvailable()) {
              model = options.model || 'gpt-4.1'
              content = await this.azure.chat(model, messages, options)
              return { content, provider: 'azure', model }
            }
            continue

          case 'spark':
          default:
            // Spark LLM is handled by existing llm-service.ts
            throw new Error('Use LLMService for Spark provider')
        }
      } catch (error) {
        console.warn(`Provider ${p} failed:`, error)
        continue
      }
    }

    throw new Error('All AI providers failed')
  }

  async getAvailableProviders(): Promise<string[]> {
    const available: string[] = ['spark'] // Spark is always available in this project

    if (await this.huggingface.isAvailable()) {
      available.push('huggingface')
    }

    if (import.meta.env.VITE_GITHUB_TOKEN) {
      available.push('github')
    }

    if (await this.azure.isAvailable()) {
      available.push('azure')
    }

    return available
  }
}

// Export singleton instance
export const aiClient = new UnifiedAIClient()
