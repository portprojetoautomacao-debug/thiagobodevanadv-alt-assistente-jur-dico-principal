/**
 * Testes para Heavy Processor Client
 */

import
{
  HeavyProcessorClient,
  getHeavyProcessorClient,
  shouldUseHeavyProcessor
} from '@/services/heavy-processor-client';
import type { Expediente } from '@/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe( 'Heavy Processor Client', () =>
{
  beforeEach( () =>
  {
    vi.clearAllMocks();
    // Habilitar Heavy Processor para os testes
    import.meta.env.VITE_HEAVY_PROCESSOR_ENABLED = 'true';
  } );

  describe( 'shouldUseHeavyProcessor', () =>
  {
    it( 'deve retornar true para volume alto (> 10 expedientes)', () =>
    {
      const expedientes: Expediente[] = Array( 15 ).fill( {
        id: '1',
        tipo: 'intimacao',
      } ) as Expediente[];

      const result = shouldUseHeavyProcessor( expedientes );
      expect( result ).toBe( true );
    } );

    it( 'deve retornar true para PDFs grandes', () =>
    {
      const expedientes: Expediente[] = [
        {
          id: '1',
          tipo: 'documento',
          conteudo: 'x'.repeat( 15000 ), // > 10KB
        } as Expediente,
      ];

      const result = shouldUseHeavyProcessor( expedientes );
      expect( result ).toBe( true );
    } );

    it( 'deve retornar false para volume baixo sem PDFs grandes', () =>
    {
      const expedientes: Expediente[] = [
        {
          id: '1',
          tipo: 'intimacao',
        } as Expediente,
      ];

      const result = shouldUseHeavyProcessor( expedientes );
      expect( result ).toBe( false );
    } );
  } );

  describe( 'HeavyProcessorClient', () =>
  {
    it( 'deve criar instância com configuração padrão', () =>
    {
      const client = new HeavyProcessorClient();
      expect( client ).toBeDefined();
    } );

    it( 'deve retornar false em isAvailable quando desabilitado', async () =>
    {
      const client = new HeavyProcessorClient( { enabled: false } );
      const available = await client.isAvailable();
      expect( available ).toBe( false );
    } );

    it( 'deve cancelar processamento em andamento', () =>
    {
      const client = new HeavyProcessorClient();
      expect( () => client.cancelProcessing() ).not.toThrow();
    } );
  } );

  describe( 'getHeavyProcessorClient', () =>
  {
    it( 'deve retornar singleton instance', () =>
    {
      const client1 = getHeavyProcessorClient();
      const client2 = getHeavyProcessorClient();
      expect( client1 ).toBe( client2 );
    } );
  } );
} );
