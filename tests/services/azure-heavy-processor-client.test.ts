/**
 * Testes para Azure Heavy Processor Client
 */

import { describe, expect, it } from 'vitest';
import {
  AzureHeavyProcessorClient,
  getAzureHeavyProcessorClient,
} from '@/services/azure-heavy-processor-client';

describe('Azure Heavy Processor Client', () => {
  describe('AzureHeavyProcessorClient', () => {
    it('deve criar instância', () => {
      const client = new AzureHeavyProcessorClient();
      expect(client).toBeDefined();
    });

    it('deve ter acesso ao Heavy Processor Client interno', () => {
      const client = new AzureHeavyProcessorClient();
      // @ts-expect-error - acessando propriedade privada para teste
      expect(client.heavyProcessor).toBeDefined();
    });
  });

  describe('getAzureHeavyProcessorClient', () => {
    it('deve retornar singleton instance', () => {
      const client1 = getAzureHeavyProcessorClient();
      const client2 = getAzureHeavyProcessorClient();
      expect(client1).toBe(client2);
    });
  });
});
