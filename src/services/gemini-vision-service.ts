/**
 * Gemini Vision Service - OCR + Raciocínio Inteligente
 *
 * Usa o Gemini 2.5 Pro que você JÁ TEM configurado
 * para fazer OCR + análise inteligente de documentos jurídicos
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getEnv } from './env-helper';

interface DocumentAnalysis
{
  fullText: string;
  structuredData: {
    tipo?: string;
    prazoFatal?: string;
    numeroProcesso?: string;
    partes?: { autor: string; reu: string };
    pedidos?: string[];
  };
  confidence: number;
  reasoning: string;
}

class GeminiVisionService
{
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor ()
  {
    const apiKey = getEnv( 'VITE_GEMINI_API_KEY', '' );
    this.genAI = new GoogleGenerativeAI( apiKey );
    // Usar Gemini 2.5 Pro que tem melhor raciocínio
    this.model = this.genAI.getGenerativeModel( {
      model: 'gemini-2.5-pro-preview-0409'
    } );
  }

  /**
   * Analisa documento (imagem ou PDF) com OCR + Raciocínio
   *
   * @example
   * const result = await geminiVision.analyzeDocument(
   *   imageBase64,
   *   'intimacao',
   *   { extractPrazo: true, extractPartes: true }
   * );
   */
  async analyzeDocument (
    imageData: string, // base64 ou URL
    documentType: 'intimacao' | 'peticao' | 'sentenca' | 'documento_geral',
    options?: {
      extractPrazo?: boolean;
      extractPartes?: boolean;
      extractPedidos?: boolean;
      customPrompt?: string;
    }
  ): Promise<DocumentAnalysis>
  {
    const prompt = this.buildPrompt( documentType, options );

    try
    {
      // Gemini aceita imagem diretamente
      const result = await this.model.generateContent( [
        prompt,
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageData.replace( /^data:image\/\w+;base64,/, '' )
          }
        }
      ] );

      const response = await result.response;
      const text = response.text();

      // Parse JSON do resultado
      const parsed = this.parseResponse( text );

      return {
        fullText: parsed.texto_completo || text,
        structuredData: {
          tipo: parsed.tipo,
          prazoFatal: parsed.prazo_fatal,
          numeroProcesso: parsed.numero_processo,
          partes: parsed.partes,
          pedidos: parsed.pedidos
        },
        confidence: parsed.confianca || 0.9,
        reasoning: parsed.raciocinio || ''
      };
    } catch ( error )
    {
      console.error( '[Gemini Vision] Erro ao analisar documento:', error );
      throw error;
    }
  }

  /**
   * OCR puro - apenas extrai texto
   */
  async extractText ( imageData: string ): Promise<string>
  {
    const result = await this.model.generateContent( [
      'Extraia TODO o texto desta imagem. Retorne apenas o texto extraído, sem comentários.',
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageData.replace( /^data:image\/\w+;base64,/, '' )
        }
      }
    ] );

    const response = await result.response;
    return response.text();
  }

  /**
   * Análise com raciocínio step-by-step
   */
  async analyzeWithReasoning (
    imageData: string,
    question: string
  ): Promise<{ answer: string; reasoning: string[] }>
  {
    const prompt = `
Analise esta imagem de documento jurídico e responda: ${ question }

Use raciocínio passo a passo (Chain of Thought):
1. Primeiro, identifique o tipo de documento
2. Localize as informações relevantes
3. Analise o contexto jurídico
4. Forneça a resposta fundamentada

Retorne JSON:
{
  "passos_raciocinio": ["passo 1", "passo 2", ...],
  "resposta": "resposta final"
}
`;

    const result = await this.model.generateContent( [
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageData.replace( /^data:image\/\w+;base64,/, '' )
        }
      }
    ] );

    const response = await result.response;
    const text = response.text();
    const parsed = JSON.parse( this.extractJSON( text ) );

    return {
      answer: parsed.resposta,
      reasoning: parsed.passos_raciocinio
    };
  }

  private buildPrompt ( documentType: string, options?: any ): string
  {
    const basePrompt = `
Você é um assistente jurídico especializado em análise de documentos processuais brasileiros.

Analise esta imagem de ${ documentType } e:
1. Extraia TODO o texto (OCR)
2. Identifique informações estruturadas
3. Use raciocínio jurídico para interpretar
`;

    const requirements = [];
    if ( options?.extractPrazo ) requirements.push( '- Prazo processual (em formato ISO)' );
    if ( options?.extractPartes ) requirements.push( '- Partes do processo (autor e réu)' );
    if ( options?.extractPedidos ) requirements.push( '- Pedidos principais' );

    const jsonFormat = `
Retorne JSON:
{
  "texto_completo": "todo o texto extraído...",
  "tipo": "tipo do documento",
  "numero_processo": "número CNJ se encontrado",
  "prazo_fatal": "YYYY-MM-DD se houver",
  "partes": { "autor": "...", "reu": "..." },
  "pedidos": ["pedido 1", "pedido 2"],
  "raciocinio": "explicação da análise",
  "confianca": 0.95
}
`;

    return `${ basePrompt }\n${ requirements.join( '\n' ) }\n${ jsonFormat }`;
  }

  private parseResponse ( text: string ): any
  {
    try
    {
      const jsonStr = this.extractJSON( text );
      return JSON.parse( jsonStr );
    } catch
    {
      return { texto_completo: text, confianca: 0.7 };
    }
  }

  private extractJSON ( text: string ): string
  {
    const match = text.match( /\{[\s\S]*\}/ );
    return match ? match[ 0 ] : '{}';
  }
}

// Exportar singleton
export const geminiVision = new GeminiVisionService();

// Exportar tipos
export type { DocumentAnalysis };
