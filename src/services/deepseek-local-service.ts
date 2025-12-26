/**
 * DeepSeek-R1 Local Service
 *
 * Integração com modelo DeepSeek-R1 rodando via Ollama
 * - Raciocínio Chain of Thought (pensa antes de responder)
 * - Roda 100% local (sem custos de API)
 * - Usa versão 1.5B (cabe na memória do Codespace)
 */

interface DeepSeekRequest
{
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  };
}

interface DeepSeekResponse
{
  model: string;
  created_at: string;
  response: string;
  thinking?: string; // Raciocínio interno do modelo
  done: boolean;
}

class DeepSeekLocalService
{
  private baseUrl = 'http://localhost:11434';
  private model = 'deepseek-r1:1.5b'; // Modelo leve que cabe na memória

  /**
   * Gera resposta com raciocínio Chain of Thought
   */
  async generate ( prompt: string, options?: {
    temperature?: number;
    showThinking?: boolean;
  } ): Promise<{ answer: string; thinking?: string }>
  {
    try
    {
      const response = await fetch( `${ this.baseUrl }/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify( {
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature: options?.temperature || 0.3,
            num_ctx: 4096
          }
        } as DeepSeekRequest )
      } );

      if ( !response.ok )
      {
        throw new Error( `Ollama error: ${ response.statusText }` );
      }

      const data = await response.json() as DeepSeekResponse;

      return {
        answer: data.response,
        thinking: options?.showThinking ? data.thinking : undefined
      };
    } catch ( error )
    {
      console.error( '[DeepSeek Local] Erro:', error );
      throw error;
    }
  }

  /**
   * Análise jurídica estruturada
   */
  async analyzeCase ( caseDescription: string ): Promise<{
    analysis: string;
    reasoning: string;
    recommendation: string;
  }>
  {
    const prompt = `
Você é um assistente jurídico especializado em direito brasileiro.

CASO: ${ caseDescription }

Analise este caso e forneça:
1. Análise jurídica (fundamentos legais)
2. Raciocínio passo a passo
3. Recomendação de ação

Retorne JSON:
{
  "analise": "análise jurídica completa",
  "raciocinio": "passos do raciocínio",
  "recomendacao": "ação recomendada"
}
`;

    const result = await this.generate( prompt, { showThinking: true } );

    try
    {
      const parsed = this.extractJSON( result.answer );
      return {
        analysis: parsed.analise || result.answer,
        reasoning: result.thinking || parsed.raciocinio || '',
        recommendation: parsed.recomendacao || ''
      };
    } catch
    {
      return {
        analysis: result.answer,
        reasoning: result.thinking || '',
        recommendation: 'Consultar advogado especializado'
      };
    }
  }

  /**
   * Cálculo de verbas rescisórias
   */
  async calculateRescisao ( params: {
    salario: number;
    tempoServico: number; // em anos
    tipo: 'com_justa_causa' | 'sem_justa_causa' | 'pedido_demissao';
  } ): Promise<{
    verbas: Record<string, number>;
    total: number;
    explicacao: string;
  }>
  {
    const prompt = `
Calcule verbas rescisórias (CLT brasileira):
- Salário: R$ ${ params.salario }
- Tempo de serviço: ${ params.tempoServico } anos
- Tipo: ${ params.tipo }

Liste todas as verbas com valores e explique o cálculo.

Retorne JSON:
{
  "verbas": {
    "aviso_previo": valor,
    "ferias_vencidas": valor,
    "ferias_proporcionais": valor,
    "decimo_terceiro": valor,
    "fgts": valor,
    "multa_40_fgts": valor
  },
  "total": valor_total,
  "explicacao": "como foi calculado"
}
`;

    const result = await this.generate( prompt, { temperature: 0.1 } );
    const parsed = this.extractJSON( result.answer );

    return {
      verbas: parsed.verbas || {},
      total: parsed.total || 0,
      explicacao: parsed.explicacao || result.answer
    };
  }

  /**
   * Verifica se o servidor Ollama está rodando
   */
  async healthCheck (): Promise<boolean>
  {
    try
    {
      const response = await fetch( `${ this.baseUrl }/api/tags` );
      return response.ok;
    } catch
    {
      return false;
    }
  }

  /**
   * Lista modelos disponíveis
   */
  async listModels (): Promise<string[]>
  {
    try
    {
      const response = await fetch( `${ this.baseUrl }/api/tags` );
      const data = await response.json();
      return data.models?.map( ( m: any ) => m.name ) || [];
    } catch
    {
      return [];
    }
  }

  private extractJSON ( text: string ): any
  {
    const match = text.match( /\{[\s\S]*\}/ );
    if ( match )
    {
      return JSON.parse( match[ 0 ] );
    }
    return {};
  }
}

export const deepseekLocal = new DeepSeekLocalService();
