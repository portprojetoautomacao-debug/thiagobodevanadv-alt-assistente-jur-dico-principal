/**
 * Teste do Gemini Vision Service
 * Demonstra OCR + Raciocínio usando o Gemini que você JÁ TEM
 */

import { geminiVision } from '@/services/gemini-vision-service';
import { describe, expect, it, vi } from 'vitest';

// Mock do Google Generative AI
vi.mock( '@google/generative-ai', () => ( {
  GoogleGenerativeAI: vi.fn().mockImplementation( () => ( {
    getGenerativeModel: vi.fn( () => ( {
      generateContent: vi.fn( async () => ( {
        response: {
          text: () => JSON.stringify( {
            texto_completo: 'Intimação para manifestação em 15 dias úteis...',
            tipo: 'Intimação para manifestação',
            numero_processo: '0001234-56.2024.8.02.0001',
            prazo_fatal: '2025-01-15',
            partes: { autor: 'João Silva', reu: 'Empresa XYZ' },
            raciocinio: 'Identificado prazo de 15 dias úteis contados da publicação',
            confianca: 0.95
          } )
        }
      } ) )
    } ) )
  } ) )
} ) );

describe( 'Gemini Vision Service', () =>
{
  describe( 'analyzeDocument', () =>
  {
    it( 'deve analisar intimação com OCR + raciocínio', async () =>
    {
      const fakeImage = 'base64ImageData';

      const result = await geminiVision.analyzeDocument(
        fakeImage,
        'intimacao',
        { extractPrazo: true, extractPartes: true }
      );

      expect( result.fullText ).toContain( 'Intimação' );
      expect( result.structuredData.prazoFatal ).toBe( '2025-01-15' );
      expect( result.structuredData.numeroProcesso ).toBe( '0001234-56.2024.8.02.0001' );
      expect( result.confidence ).toBeGreaterThan( 0.8 );
      expect( result.reasoning ).toBeTruthy();
    } );

    it( 'deve extrair partes do processo', async () =>
    {
      const result = await geminiVision.analyzeDocument(
        'imageData',
        'peticao',
        { extractPartes: true }
      );

      expect( result.structuredData.partes ).toBeDefined();
      expect( result.structuredData.partes?.autor ).toBe( 'João Silva' );
      expect( result.structuredData.partes?.reu ).toBe( 'Empresa XYZ' );
    } );
  } );

  describe( 'extractText', () =>
  {
    it( 'deve fazer OCR puro', async () =>
    {
      const text = await geminiVision.extractText( 'imageData' );

      expect( text ).toContain( 'Intimação' );
      expect( typeof text ).toBe( 'string' );
    } );
  } );

  describe( 'analyzeWithReasoning', () =>
  {
    it( 'deve fornecer raciocínio step-by-step', async () =>
    {
      const result = await geminiVision.analyzeWithReasoning(
        'imageData',
        'Qual o prazo desta intimação?'
      );

      expect( result.answer ).toBeTruthy();
      expect( result.reasoning ).toBeInstanceOf( Array );
      expect( result.reasoning.length ).toBeGreaterThan( 0 );
    } );
  } );
} );
