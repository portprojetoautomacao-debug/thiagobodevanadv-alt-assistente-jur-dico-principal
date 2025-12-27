/**
 * Testes para AI Streaming Service
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeAIQuickCommand, streamAIFromBackend } from "./ai-stream";

type FetchFn = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
const fetchMock = vi.fn<FetchFn>();
vi.stubGlobal("fetch", fetchMock);

describe("AI Streaming Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("streamAIFromBackend", () => {
    it("deve fazer streaming de resposta SSE corretamente", async () => {
      const chunks: string[] = [];
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi
              .fn()
              .mockResolvedValueOnce({
                value: new TextEncoder().encode('data: {"text":"Olá"}\n\n'),
                done: false,
              })
              .mockResolvedValueOnce({
                value: new TextEncoder().encode('data: {"text":" mundo"}\n\n'),
                done: false,
              })
              .mockResolvedValueOnce({
                value: new TextEncoder().encode("data: [DONE]\n\n"),
                done: true,
              }),
          }),
        },
      };

      fetchMock.mockResolvedValue(mockResponse as unknown as Response);

      await streamAIFromBackend("Teste prompt", {
        onChunk: (chunk) => chunks.push(chunk),
        onComplete: () => {},
        onError: () => {},
      });

      expect(chunks).toEqual(["Olá", " mundo"]);
    });

    it("deve tratar erros de rede", async () => {
      fetchMock.mockRejectedValue(new Error("Network error"));

      let errorReceived = false;

      await streamAIFromBackend("Teste", {
        onChunk: () => {},
        onComplete: () => {},
        onError: () => {
          errorReceived = true;
        },
      });

      expect(errorReceived).toBe(true);
    });

    it("deve tratar resposta sem body", async () => {
      const mockResponse = {
        ok: true,
        body: null,
      };

      fetchMock.mockResolvedValue(mockResponse as unknown as Response);

      let errorReceived = false;

      await streamAIFromBackend("Teste", {
        onChunk: () => {},
        onComplete: () => {},
        onError: () => {
          errorReceived = true;
        },
      });

      expect(errorReceived).toBe(true);
    });

    it("deve processar múltiplas linhas SSE em um chunk", async () => {
      const chunks: string[] = [];
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi
              .fn()
              .mockResolvedValueOnce({
                value: new TextEncoder().encode(
                  'data: {"text":"Linha1"}\n\ndata: {"text":"Linha2"}\n\n'
                ),
                done: false,
              })
              .mockResolvedValueOnce({
                done: true,
              }),
          }),
        },
      };

      fetchMock.mockResolvedValue(mockResponse as unknown as Response);

      await streamAIFromBackend("Teste", {
        onChunk: (chunk) => chunks.push(chunk),
        onComplete: () => {},
        onError: () => {},
      });

      expect(chunks).toEqual(["Linha1", "Linha2"]);
    });
  });

  describe("executeAIQuickCommand", () => {
    it('deve executar comando "continue"', async () => {
      const chunks: string[] = [];
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi
              .fn()
              .mockResolvedValueOnce({
                value: new TextEncoder().encode('data: {"text":"Continuando..."}\n\n'),
                done: false,
              })
              .mockResolvedValueOnce({
                done: true,
              }),
          }),
        },
      };

      fetchMock.mockResolvedValue(mockResponse as unknown as Response);

      await executeAIQuickCommand("continue", "Texto inicial", {
        onChunk: (chunk) => chunks.push(chunk),
        onComplete: () => {},
        onError: () => {},
      });

      expect(chunks.length).toBeGreaterThan(0);
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/ai/stream",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ "Content-Type": "application/json" }),
        })
      );
    });

    it('deve formatar prompt corretamente para comando "formalize"', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn().mockResolvedValueOnce({ done: true }),
          }),
        },
      };

      fetchMock.mockResolvedValue(mockResponse as unknown as Response);

      await executeAIQuickCommand("formalize", "Texto informal", {
        onChunk: () => {},
        onComplete: () => {},
        onError: () => {},
      });

      const callArgs = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
      const body = JSON.parse(String(callArgs?.body));

      expect(body.prompt).toContain("linguagem jurídica formal");
      expect(body.prompt).toContain("Texto informal");
    });
  });
});
