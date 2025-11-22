import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import cronHandler from '../../api/cron';
import agentsHandler from '../../api/agents';
import * as djenClient from '../../lib/api/djen-client';
import * as kvUtils from '../../lib/api/kv-utils';

// Mock dependencies
vi.mock('../../lib/api/djen-client');
vi.mock('../../lib/api/kv-utils');
vi.mock('../../lib/api/llm-proxy', () => ({
  generateText: vi.fn().mockResolvedValue(JSON.stringify({
    summary: "Publicação analisada com sucesso",
    deadlines: [{ date: "2025-12-01", description: "Prazo fatal" }],
    suggestedActions: ["Agendar reunião", "Protocolar defesa"]
  }))
}));

describe('Integration: DJEN Monitor -> Agent Workflow', () => {
  const mockLawyer = {
    id: 'lawyer-123',
    name: 'Thiago Bodevan Veiga',
    oab: '184404',
    enabled: true,
    tribunals: ['TJMG']
  };

  const mockPublication = {
    id: 12345,
    data: '2025-11-22',
    tribunal: 'TJMG',
    tipo: 'Intimação',
    teor: 'Fica intimada a parte para apresentar contrarrazões...',
    numeroProcesso: '5001234-56.2025.8.13.0024',
    link: 'https://djen.jus.br/pub/123',
    matchType: 'oab',
    advogados: ['Thiago Bodevan Veiga']
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup KV mocks
    (kvUtils.getMonitoredLawyers as any).mockResolvedValue([mockLawyer]);
    (kvUtils.storePublication as any).mockResolvedValue(undefined);
    (kvUtils.queueNotification as any).mockResolvedValue(undefined);
    (kvUtils.updateLastDJENCheck as any).mockResolvedValue(undefined);
    
    // Setup DJEN mock
    (djenClient.consultarDJENForLawyer as any).mockResolvedValue({
      resultados: [mockPublication],
      erros: [],
      rateLimitWarning: false
    });
  });

  it('Step 1: DJEN Monitor should find publications and store them', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: { action: 'djen-monitor' },
      headers: { authorization: 'Bearer cron-secret' } // Simulate Vercel Cron
    });

    await cronHandler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    
    expect(data.result.publicationsFound).toBe(1);
    expect(data.result.lawyersChecked).toBe(1);
    
    // Verify DJEN was called with correct parameters
    expect(djenClient.consultarDJENForLawyer).toHaveBeenCalledWith(
      ['TJMG'],
      'Thiago Bodevan Veiga',
      '184404',
      undefined,
      undefined,
      'D'
    );

    // Verify publication was stored
    expect(kvUtils.storePublication).toHaveBeenCalledWith(expect.objectContaining({
      lawyerName: 'Thiago Bodevan Veiga',
      numeroProcesso: '5001234-56.2025.8.13.0024',
      source: 'DJEN'
    }));
  });

  it('Step 2: Agent should process the publication (Simulated Task)', async () => {
    // Simulate creating a task based on the publication found in Step 1
    const taskData = {
      id: 'task-1',
      agentId: 'analyzer-agent',
      type: 'analyze_document',
      status: 'queued',
      data: {
        text: mockPublication.teor,
        context: `Processo: ${mockPublication.numeroProcesso}`
      }
    };

    // Mock KV to return this task
    // Since getKv is not exported, we need to mock the functions that use it
    // But in this test we are mocking the module, so we can just mock the exported functions if they were used
    // However, agentsHandler uses getKv internally.
    // Let's look at how we mocked kvUtils.
    
    // Re-mock kvUtils for this specific test case to return our task
    // We need to mock the implementation of getKv if it was exported, but it's not.
    // But wait, agentsHandler imports getAgents, updateAgents etc.
    // Let's see what agentsHandler uses.
    
    // agentsHandler uses:
    // import { getAgents, updateAgents, getTaskQueue, updateTaskQueue, ... } from '../lib/api/kv-utils';
    
    // So we should mock getTaskQueue and updateTaskQueue
    // (kvUtils.getTaskQueue as any) = vi.fn().mockResolvedValue([taskData]);
    // (kvUtils.updateTaskQueue as any) = vi.fn().mockResolvedValue(undefined);
    (kvUtils.getAgents as any) = vi.fn().mockResolvedValue([{
      id: 'analyzer-agent',
      name: 'Analyzer',
      type: 'analyzer',
      status: 'idle',
      enabled: true
    }]);
    (kvUtils.updateAgents as any) = vi.fn().mockResolvedValue(undefined);
    (kvUtils.getCompletedTasks as any) = vi.fn().mockResolvedValue([]);
    (kvUtils.updateCompletedTasks as any) = vi.fn().mockResolvedValue(undefined);

    // Mock fetch for LLM proxy
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({
          summary: "Sentença proferida. Necessário comunicar cliente e analisar riscos.",
          deadlines: [{ date: "2025-12-01", description: "Prazo recursal" }],
          suggestedActions: [
            "Calcular prazo recursal", 
            "Comunicar cliente sobre sentença", 
            "Analisar riscos da decisão",
            "Verificar andamento no DataJud"
          ]
        }) } }],
        usage: { total_tokens: 150 }
      })
    } as any);

    const { req, res } = createMocks({
      method: 'POST',
      query: { action: 'process-task' },
      body: { 
        task: taskData,
        agent: {
          id: 'analyzer-agent',
          name: 'Analyzer',
          type: 'analyzer',
          status: 'idle',
          enabled: true
        }
      },
      headers: { authorization: 'Bearer cron-secret' }
    });

    await agentsHandler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    const result = JSON.parse(res._getData());

    expect(result.ok).toBe(true);
    expect(result.result).toBeDefined();
    
    // Verify AI analysis result
    const analysis = result.result;
    expect(analysis.summary).toBe("Sentença proferida. Necessário comunicar cliente e analisar riscos.");
    expect(analysis.deadlines).toHaveLength(1);
  });
  
  it('Step 3: Agent Queue Processing should chain new tasks based on analysis', async () => {
    const taskData = {
      id: 'task-chain-test',
      agentId: 'analyzer-agent',
      type: 'analyze_document',
      status: 'queued',
      data: { text: "Sentença com custas" }
    };

    // Mock fetch to handle multiple endpoints for the queue processing flow
    global.fetch = vi.fn().mockImplementation((url, options) => {
      // 1. GET Task Queue
      if (url.toString().includes('/_spark/kv/agent-task-queue') && (!options || options.method === 'GET' || !options.method)) {
        return Promise.resolve({ 
          ok: true, 
          json: async () => ({ value: [taskData] }) 
        });
      }
      
      // 2. GET Agents
      if (url.toString().includes('/_spark/kv/autonomous-agents')) {
        return Promise.resolve({ 
          ok: true, 
          json: async () => ({ value: [{ id: 'analyzer-agent', enabled: true, type: 'analyzer', name: 'Analyzer' }] }) 
        });
      }
      
      // 3. LLM Call
      if (url.toString().includes('/_spark/llm')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: JSON.stringify({
              suggestedActions: [
                "Pagar custas processuais",
                "Arquivar documento na pasta do processo",
                "Verificar compliance LGPD",
                "Traduzir termos para linguagem simples"
              ]
            }) } }],
            usage: { total_tokens: 150 }
          })
        });
      }

      // 4. PUT Task Queue (Update)
      if (url.toString().includes('/_spark/kv/agent-task-queue') && options?.method === 'PUT') {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }

      return Promise.resolve({ ok: false, statusText: 'Not Found: ' + url });
    }) as any;

    const { req, res } = createMocks({
      method: 'POST',
      query: { action: 'process-queue' },
      headers: { authorization: 'Bearer cron-secret' }
    });

    await agentsHandler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    
    // Verify that the queue update was called with the new chained tasks
    const putCall = (global.fetch as any).mock.calls.find((call: any[]) => 
      call[0].toString().includes('/_spark/kv/agent-task-queue') && call[1].method === 'PUT'
    );
    
    expect(putCall).toBeDefined();
    const body = JSON.parse(putCall[1].body);
    const updatedQueue = body.value;
    
    // Original task should be completed (or we are just checking the pushed tasks)
    // The code pushes new tasks to the queue array.
    
    // Check for Billing Analyst task
    const billingTask = updatedQueue.find((t: any) => t.type === 'billing_analysis');
    expect(billingTask).toBeDefined();
    expect(billingTask.agentId).toBe('billing-analyst');
    
    // Check for Organizer task
    const organizerTask = updatedQueue.find((t: any) => t.type === 'organize_files');
    expect(organizerTask).toBeDefined();
    expect(organizerTask.agentId).toBe('document-organizer');

    // Check for Compliance task
    const complianceTask = updatedQueue.find((t: any) => t.type === 'compliance_check');
    expect(complianceTask).toBeDefined();
    expect(complianceTask.agentId).toBe('compliance-officer');

    // Check for Translator task
    const translatorTask = updatedQueue.find((t: any) => t.type === 'legal_translation');
    expect(translatorTask).toBeDefined();
    expect(translatorTask.agentId).toBe('legal-translator');
  });
});
