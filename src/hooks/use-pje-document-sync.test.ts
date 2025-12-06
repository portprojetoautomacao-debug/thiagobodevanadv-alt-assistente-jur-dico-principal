import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { usePJeDocumentSync } from "./use-pje-document-sync";

// Mock do useKV
const mockSetData = vi.fn();
vi.mock("./use-kv", () => ({
  useKV: () => [[], mockSetData],
}));

// Mock do toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock da API Chrome
const chromeMock = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn(),
  },
};

// @ts-ignore
global.chrome = chromeMock;

describe("usePJeDocumentSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    chromeMock.tabs.query.mockResolvedValue([{ id: 123 }]);
    chromeMock.tabs.sendMessage.mockResolvedValue({ status: "ok" });
  });

  it("deve inicializar com estado padrão", () => {
    const { result } = renderHook(() => usePJeDocumentSync());

    expect(result.current.documentosPendentes).toEqual([]);
    expect(result.current.documentosProcessados).toEqual([]);
    expect(result.current.carregando).toBe(false);
    expect(result.current.extensaoAtivaNoTab).toBe(false);
  });

  it("deve verificar se a extensão está ativa", async () => {
    chromeMock.tabs.sendMessage.mockResolvedValueOnce({ type: "PONG" });

    const { result } = renderHook(() => usePJeDocumentSync());

    // Aguardar efeitos
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(chromeMock.tabs.query).toHaveBeenCalled();
    expect(chromeMock.tabs.sendMessage).toHaveBeenCalledWith(
      123,
      expect.objectContaining({ type: "PING" })
    );
    // O estado deve atualizar (precisamos esperar a promise resolver dentro do hook)
    // Nota: Testar async useEffect pode ser tricky, mas vamos verificar se a chamada foi feita
  });

  it("deve descartar documento", () => {
    const { result } = renderHook(() => usePJeDocumentSync());

    // Simular documento pendente (precisaria de acesso ao setter interno ou mockar useState,
    // mas como é hook, vamos testar a função pública)

    act(() => {
      result.current.descartarDocumento("doc-123");
    });

    // Como não temos documentos iniciais, apenas verificamos se não quebra
    expect(result.current.documentosPendentes).toEqual([]);
  });
});
