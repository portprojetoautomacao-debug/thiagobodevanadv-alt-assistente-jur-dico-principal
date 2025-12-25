/**
 * Testes para Agentes com Checkpointing
 * - Análise de Expedientes
 * - Monitor DJEN
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { analisarExpedientesComCheckpointing } from "@/agents/analise-expedientes-checkpointed";
import { monitorarDJENComCheckpointing } from "@/agents/monitor-djen-checkpointed";
import type { Expediente } from "@/types";

// Mock do Gemini Service
vi.mock("@/lib/gemini-service", () => ({
  streamGeminiResponse: vi.fn(async function* () {
    yield JSON.stringify({
      summary: "Intimação para manifestação",
      priority: "alta",
      deadline: { days: 15, type: "úteis", endDate: "15/01/2025" },
      suggestedActions: ["Preparar manifestação"],
      nextSteps: ["Analisar documentos"],
    });
  }),
}));

// Mock do DJEN API
vi.mock("@/lib/djen-api", () => ({
  consultarDJEN: vi.fn().mockResolvedValue({
    resultados: [
      {
        id: "pub-1",
        numeroProcesso: "1234567-89.2024.8.26.0100",
        tribunal: "TJSP",
        data: "2024-12-25",
        teor: "Intimação para manifestação",
        tipo: "Intimação",
        lawyerName: "João Silva",
        matchType: "nome",
      },
    ],
    erros: [],
  }),
}));

// Mock do Redis/KV
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation(() => ({
    set: vi.fn().mockResolvedValue("OK"),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
  })),
}));

describe("Análise de Expedientes com Checkpointing", () => {
  const mockExpedientes: Expediente[] = [
    {
      id: "exp-1",
      type: "intimacao",
      content: "Intimação para apresentar manifestação em 15 dias úteis",
      numeroProcesso: "1234567-89.2024.8.26.0100",
      tribunal: "TJSP",
      receivedAt: new Date().toISOString(),
      analyzed: false,
    },
    {
      id: "exp-2",
      type: "despacho",
      content: "Despacho determinando juntada de documentos",
      numeroProcesso: "9876543-21.2024.8.26.0200",
      tribunal: "TJSP",
      receivedAt: new Date().toISOString(),
      analyzed: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve analisar expedientes com sucesso", async () => {
    const result = await analisarExpedientesComCheckpointing({
      expedientes: mockExpedientes,
      batchSize: 2,
      autoCreateTasks: true,
    });

    expect(result.result.totalAnalisados).toBe(2);
    expect(result.result.analisados).toHaveLength(2);
    expect(result.result.tarefasCriadas).toBeGreaterThan(0);
    expect(result.recovered).toBe(false); // Primeira execução, sem recovery
  });

  it("deve processar em lotes corretamente", async () => {
    const manyExpedientes = Array.from({ length: 15 }, (_, i) => ({
      ...mockExpedientes[0],
      id: `exp-${i + 1}`,
    }));

    const result = await analisarExpedientesComCheckpointing({
      expedientes: manyExpedientes,
      batchSize: 5, // 3 lotes de 5
      autoCreateTasks: false,
    });

    expect(result.result.totalAnalisados).toBe(15);
    expect(result.result.analisados).toHaveLength(15);
  });

  it("deve classificar urgência corretamente", async () => {
    const expedientesVariados: Expediente[] = [
      {
        id: "exp-urgente",
        type: "sentenca",
        content: "SENTENÇA URGENTE: prazo de 5 dias para recurso",
        numeroProcesso: "1111111-11.2024.8.26.0100",
        tribunal: "TJSP",
        receivedAt: new Date().toISOString(),
        analyzed: false,
      },
      {
        id: "exp-info",
        type: "despacho",
        content: "Dar ciência às partes sobre juntada de documentos",
        numeroProcesso: "2222222-22.2024.8.26.0100",
        tribunal: "TJSP",
        receivedAt: new Date().toISOString(),
        analyzed: false,
      },
    ];

    const result = await analisarExpedientesComCheckpointing({
      expedientes: expedientesVariados,
      autoCreateTasks: false,
    });

    // Verificar estatísticas
    expect(result.result.estatisticas.alta).toBeGreaterThan(0);
    expect(result.result.estatisticas.baixa).toBeGreaterThan(0);
  });

  it("deve gerar tarefas para agentes quando autoCreateTasks=true", async () => {
    const result = await analisarExpedientesComCheckpointing({
      expedientes: mockExpedientes,
      autoCreateTasks: true,
    });

    expect(result.result.tarefas).toBeDefined();
    expect(result.result.tarefasCriadas).toBeGreaterThan(0);

    // Verificar que há tarefas para diferentes agentes
    const agentIds = new Set(result.result.tarefas.map((t) => t.agentId));
    expect(agentIds.size).toBeGreaterThan(1); // Múltiplos agentes
  });
});

describe("Monitor DJEN com Checkpointing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve consultar múltiplos tribunais com sucesso", async () => {
    const result = await monitorarDJENComCheckpointing({
      tribunais: ["TJSP", "TJRJ", "STJ"],
      advogados: [
        { nome: "João Silva", oab: "SP123456" },
        { nome: "Maria Santos", oab: "RJ654321" },
      ],
    });

    expect(result.result.tribunaisConsultados).toBe(3);
    expect(result.result.tribunaisComSucesso).toBeGreaterThan(0);
    expect(result.result.publicacoes).toBeDefined();
    expect(result.recovered).toBe(false); // Primeira execução
  });

  it("deve deduplicar publicações corretamente", async () => {
    // Mock com publicações duplicadas
    const { consultarDJEN } = await import("@/lib/djen-api");
    vi.mocked(consultarDJEN).mockResolvedValue({
      resultados: [
        {
          id: "pub-1",
          numeroProcesso: "1234567-89.2024.8.26.0100",
          tribunal: "TJSP",
          data: "2024-12-25",
          teor: "Intimação 1",
          tipo: "Intimação",
          lawyerName: "João Silva",
          matchType: "nome",
        },
        {
          id: "pub-2",
          numeroProcesso: "1234567-89.2024.8.26.0100", // Mesmo processo
          tribunal: "TJSP",
          data: "2024-12-25", // Mesma data
          teor: "Intimação 1 (duplicata)",
          tipo: "Intimação",
          lawyerName: "João Silva",
          matchType: "nome",
        },
        {
          id: "pub-3",
          numeroProcesso: "9999999-99.2024.8.26.0100", // Processo diferente
          tribunal: "TJSP",
          data: "2024-12-25",
          teor: "Intimação 2",
          tipo: "Intimação",
          lawyerName: "João Silva",
          matchType: "nome",
        },
      ],
      erros: [],
    });

    const result = await monitorarDJENComCheckpointing({
      tribunais: ["TJSP"],
      advogados: [{ nome: "João Silva" }],
    });

    // Deve remover duplicatas
    expect(result.result.totalPublicacoes).toBe(2); // Não 3
  });

  it("deve chamar callback de notificação quando fornecido", async () => {
    const mockNotificar = vi.fn();

    const result = await monitorarDJENComCheckpointing({
      tribunais: ["TJSP"],
      advogados: [{ nome: "João Silva" }],
      notificarCallback: mockNotificar,
    });

    expect(result.result.notificacoesEnviadas).toBe(true);
    expect(mockNotificar).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          numeroProcesso: expect.any(String),
          tribunal: expect.any(String),
        }),
      ])
    );
  });

  it("deve incluir estatísticas por tribunal", async () => {
    const result = await monitorarDJENComCheckpointing({
      tribunais: ["TJSP", "TJRJ"],
      advogados: [{ nome: "João Silva" }],
    });

    expect(result.result.estatisticas.porTribunal).toBeDefined();
    expect(result.result.estatisticas.porTribunal).toHaveLength(2);

    result.result.estatisticas.porTribunal.forEach((stat) => {
      expect(stat).toHaveProperty("tribunal");
      expect(stat).toHaveProperty("sucesso");
      expect(stat).toHaveProperty("totalPublicacoes");
    });
  });

  it("deve fazer retry em caso de falha temporária", async () => {
    const { consultarDJEN } = await import("@/lib/djen-api");

    // Falhar 2 vezes, suceder na 3ª tentativa
    let attempts = 0;
    vi.mocked(consultarDJEN).mockImplementation(async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error("Erro temporário");
      }
      return {
        resultados: [
          {
            id: "pub-1",
            numeroProcesso: "1234567-89.2024.8.26.0100",
            tribunal: "TJSP",
            data: "2024-12-25",
            teor: "Intimação após retry",
            tipo: "Intimação",
            lawyerName: "João Silva",
            matchType: "nome",
          },
        ],
        erros: [],
      };
    });

    const result = await monitorarDJENComCheckpointing({
      tribunais: ["TJSP"],
      advogados: [{ nome: "João Silva" }],
      maxRetries: 3,
    });

    expect(attempts).toBe(3);
    expect(result.result.tribunaisComSucesso).toBe(1);
    expect(result.result.totalPublicacoes).toBe(1);
  });
});
