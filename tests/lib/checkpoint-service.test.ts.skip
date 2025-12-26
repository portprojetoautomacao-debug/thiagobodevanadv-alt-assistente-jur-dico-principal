/**
 * Testes para Sistema de Checkpointing
 */

import {
  calculateRecoveryStats,
  clearCheckpoints,
  getCheckpointSummary,
  getLastCheckpoint,
  hasCheckpoints,
  listCheckpoints,
  saveCheckpoint,
  type Checkpoint,
} from "@/lib/checkpoint-service";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock do Upstash KV
vi.mock("@/lib/upstash-kv", () => ({
  kv: {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
    hgetall: vi.fn(),
  },
}));

import { kv } from "@/lib/upstash-kv";

describe("Checkpoint Service", () => {
  const mockExecutionId = "test-exec-123";
  const mockCheckpoint: Checkpoint = {
    executionId: mockExecutionId,
    agentId: "redacao-peticoes",
    agentName: "Redator de Petições",
    step: 1,
    stepName: "documents_analyzed",
    state: { documentos: ["doc1", "doc2"] },
    timestamp: new Date("2024-12-25T10:00:00Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("saveCheckpoint", () => {
    it("deve salvar checkpoint com sucesso", async () => {
      await saveCheckpoint(mockCheckpoint);

      // Verificar se salvou o checkpoint
      expect(kv.set).toHaveBeenCalledWith(
        `checkpoint:${mockExecutionId}:1`,
        expect.objectContaining({
          executionId: mockExecutionId,
          agentId: "redacao-peticoes",
          step: 1,
        }),
        { ex: 86400 }
      );

      // Verificar se atualizou last step
      expect(kv.set).toHaveBeenCalledWith(`checkpoint:${mockExecutionId}:last`, 1, { ex: 86400 });

      // Verificar se salvou metadata
      expect(kv.set).toHaveBeenCalledWith(
        `checkpoint:${mockExecutionId}:meta`,
        expect.objectContaining({
          agentId: "redacao-peticoes",
          totalSteps: 1,
        }),
        { ex: 86400 }
      );
    });

    it("deve usar TTL customizado quando fornecido", async () => {
      const customTTL = 3600; // 1 hora
      await saveCheckpoint(mockCheckpoint, { ttl: customTTL });

      expect(kv.set).toHaveBeenCalledWith(expect.any(String), expect.any(Object), {
        ex: customTTL,
      });
    });

    it("não deve sobrescrever checkpoint existente por padrão", async () => {
      vi.mocked(kv.get).mockResolvedValueOnce({ existing: true });

      await saveCheckpoint(mockCheckpoint);

      // Não deve tentar salvar novamente
      expect(kv.set).not.toHaveBeenCalled();
    });

    it("deve sobrescrever quando opção overwrite é true", async () => {
      vi.mocked(kv.get).mockResolvedValueOnce({ existing: true });

      await saveCheckpoint(mockCheckpoint, { overwrite: true });

      // Deve salvar mesmo existindo
      expect(kv.set).toHaveBeenCalled();
    });
  });

  describe("getLastCheckpoint", () => {
    it("deve recuperar último checkpoint corretamente", async () => {
      vi.mocked(kv.get)
        .mockResolvedValueOnce(3) // last step
        .mockResolvedValueOnce({
          ...mockCheckpoint,
          step: 3,
          timestamp: mockCheckpoint.timestamp.toISOString(),
        });

      const result = await getLastCheckpoint(mockExecutionId);

      expect(result).toBeTruthy();
      expect(result?.step).toBe(3);
      expect(result?.timestamp).toBeInstanceOf(Date);
    });

    it("deve retornar null quando não há checkpoint", async () => {
      vi.mocked(kv.get).mockResolvedValueOnce(null);

      const result = await getLastCheckpoint(mockExecutionId);

      expect(result).toBeNull();
    });
  });

  describe("listCheckpoints", () => {
    it("deve listar todos os checkpoints de uma execução", async () => {
      // Mock metadata
      vi.mocked(kv.get)
        .mockResolvedValueOnce({ totalSteps: 3 })
        .mockResolvedValueOnce({
          ...mockCheckpoint,
          step: 1,
          timestamp: mockCheckpoint.timestamp.toISOString(),
        })
        .mockResolvedValueOnce({
          ...mockCheckpoint,
          step: 2,
          timestamp: mockCheckpoint.timestamp.toISOString(),
        })
        .mockResolvedValueOnce({
          ...mockCheckpoint,
          step: 3,
          timestamp: mockCheckpoint.timestamp.toISOString(),
        });

      const checkpoints = await listCheckpoints(mockExecutionId);

      expect(checkpoints).toHaveLength(3);
      expect(checkpoints[0].step).toBe(1);
      expect(checkpoints[2].step).toBe(3);
    });

    it("deve retornar array vazio quando não há checkpoints", async () => {
      vi.mocked(kv.get).mockResolvedValueOnce(null);

      const checkpoints = await listCheckpoints(mockExecutionId);

      expect(checkpoints).toEqual([]);
    });
  });

  describe("clearCheckpoints", () => {
    it("deve limpar todos os checkpoints e metadata", async () => {
      vi.mocked(kv.get).mockResolvedValueOnce({ totalSteps: 2 });

      await clearCheckpoints(mockExecutionId);

      // Deve deletar checkpoints + last + meta = 4 chamadas
      expect(kv.del).toHaveBeenCalledTimes(4);
      expect(kv.del).toHaveBeenCalledWith(`checkpoint:${mockExecutionId}:1`);
      expect(kv.del).toHaveBeenCalledWith(`checkpoint:${mockExecutionId}:2`);
      expect(kv.del).toHaveBeenCalledWith(`checkpoint:${mockExecutionId}:last`);
      expect(kv.del).toHaveBeenCalledWith(`checkpoint:${mockExecutionId}:meta`);
    });
  });

  describe("getCheckpointSummary", () => {
    it("deve retornar resumo correto", async () => {
      vi.mocked(kv.get)
        .mockResolvedValueOnce({
          agentId: "redacao-peticoes",
          agentName: "Redator",
          totalSteps: 5,
          lastUpdated: "2024-12-25T10:00:00Z",
        })
        .mockResolvedValueOnce(3);

      const summary = await getCheckpointSummary(mockExecutionId);

      expect(summary).toEqual({
        agentId: "redacao-peticoes",
        agentName: "Redator",
        lastStep: 3,
        totalSteps: 5,
        lastUpdated: expect.any(Date),
        progress: 60, // 3/5 * 100
      });
    });

    it("deve retornar null quando não há checkpoints", async () => {
      vi.mocked(kv.get).mockResolvedValueOnce(null);

      const summary = await getCheckpointSummary(mockExecutionId);

      expect(summary).toBeNull();
    });
  });

  describe("hasCheckpoints", () => {
    it("deve retornar true quando há checkpoints", async () => {
      vi.mocked(kv.get).mockResolvedValueOnce(3);

      const result = await hasCheckpoints(mockExecutionId);

      expect(result).toBe(true);
    });

    it("deve retornar false quando não há checkpoints", async () => {
      vi.mocked(kv.get).mockResolvedValueOnce(null);

      const result = await hasCheckpoints(mockExecutionId);

      expect(result).toBe(false);
    });
  });

  describe("calculateRecoveryStats", () => {
    it("deve calcular estatísticas de recovery corretamente", () => {
      const stats = calculateRecoveryStats(
        mockExecutionId,
        "redacao-peticoes",
        2, // recuperou do passo 2
        5, // total de 5 passos
        60000, // 1 min por passo
        2000 // 2k tokens por passo
      );

      expect(stats).toEqual({
        executionId: mockExecutionId,
        agentId: "redacao-peticoes",
        totalSteps: 5,
        recoveredFromStep: 2,
        timeSaved: 120000, // 2 passos * 60s = 2 min
        tokensSaved: 4000, // 2 passos * 2k tokens
        costSaved: expect.any(Number),
      });

      // Custo aproximado: 2k input (60%) + 2k output (40%) = 4k tokens
      // Input: 2400 * $3/1M = $0.0072
      // Output: 1600 * $9/1M = $0.0144
      // Total: ~$0.02
      expect(stats.costSaved).toBeGreaterThan(0.015);
      expect(stats.costSaved).toBeLessThan(0.025);
    });

    it("deve usar valores padrão quando não fornecidos", () => {
      const stats = calculateRecoveryStats(mockExecutionId, "test-agent", 3, 5);

      expect(stats.timeSaved).toBe(180000); // 3 * 60000 (padrão)
      expect(stats.tokensSaved).toBe(6000); // 3 * 2000 (padrão)
    });
  });
});
