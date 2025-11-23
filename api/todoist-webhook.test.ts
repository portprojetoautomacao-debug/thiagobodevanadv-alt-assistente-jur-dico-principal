/**
 * Testes do Webhook do Todoist
 * 
 * Testa o endpoint que recebe eventos do Todoist e processa
 * com o agente de IA
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRequest, createResponse } from 'node-mocks-http';

// Mocks hoisted
const mocks = vi.hoisted(() => ({
  processWebhookEvent: vi.fn(),
  initializeTodoistClient: vi.fn(),
}));

// Mock das dependências
vi.mock('../src/lib/agents/todoist-agent', () => ({
  todoistAgent: {
    processWebhookEvent: mocks.processWebhookEvent,
  },
}));

vi.mock('../src/lib/todoist-integration', () => ({
  initializeTodoistClient: mocks.initializeTodoistClient,
}));

vi.mock('../src/lib/config', () => ({
  config: {
    todoist: {
      apiKey: 'test-api-key',
    },
  },
}));

// Importar o handler APÓS os mocks
import handler from './todoist-webhook';

describe('Todoist Webhook Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Limpar variáveis de ambiente
    delete process.env.TODOIST_WEBHOOK_SECRET;
  });

  describe('Validação de Método HTTP', () => {
    it('deve rejeitar métodos diferentes de POST', async () => {
      const req = createRequest({
        method: 'GET',
      });
      const res = createResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(405);
      expect(res._getJSONData()).toEqual({ error: 'Method not allowed' });
    });

    it('deve aceitar método POST', async () => {
      const req = createRequest({
        method: 'POST',
        body: {
          event_name: 'item:added',
          event_data: {
            id: '123',
            content: 'Nova tarefa',
          },
        },
      });
      const res = createResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(200);
    });
  });

  describe('Processamento de Eventos', () => {
    it('deve processar evento de tarefa adicionada', async () => {
      const eventData = {
        event_name: 'item:added',
        event_data: {
          id: '123',
          content: 'Nova tarefa jurídica',
          description: 'Processo 1234567-89',
        },
      };

      const req = createRequest({
        method: 'POST',
        body: eventData,
      });
      const res = createResponse();

      await handler(req, res);

      expect(mocks.processWebhookEvent).toHaveBeenCalledWith(eventData);
      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual({ status: 'processed' });
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve retornar 500 em caso de erro no processamento', async () => {
      mocks.processWebhookEvent.mockRejectedValueOnce(
        new Error('Processing error')
      );

      const req = createRequest({
        method: 'POST',
        body: {
          event_name: 'item:added',
        },
      });
      const res = createResponse();

      await handler(req, res);

      expect(res.statusCode).toBe(500);
      expect(res._getJSONData()).toEqual({ error: 'Internal server error' });
    });
  });
});

