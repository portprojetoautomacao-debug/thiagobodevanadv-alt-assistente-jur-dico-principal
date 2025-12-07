import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

// @ts-expect-error - Mocking global chrome object
global.chrome = chromeMock;

describe("usePJeDocumentSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    chromeMock.tabs.query.mockResolvedValue([{ id: 123 }]);
    chromeMock.tabs.sendMessage.mockResolvedValue({ status: "ok" });
  });

  it("deve inicializar com estado padrão", async () => {
    const { result } = renderHook(() => usePJeDocumentSync());

    expect(result.current.documentosPendentes).toEqual([]);
    expect(result.current.documentosProcessados).toEqual([]);
    expect(result.current.carregando).toBe(false);
    expect(result.current.extensaoAtivaNoTab).toBe(false);

    // Aguardar efeito inicial para evitar warnings
    await waitFor(() => {
      expect(chromeMock.tabs.query).toHaveBeenCalled();
    });
  });

  it("deve verificar se a extensão está ativa", async () => {
    chromeMock.tabs.sendMessage.mockResolvedValueOnce({ type: "PONG" });

    renderHook(() => usePJeDocumentSync());

    // Aguardar efeitos
    await waitFor(() => {
      expect(chromeMock.tabs.query).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(chromeMock.tabs.sendMessage).toHaveBeenCalledWith(
        123,
        expect.objectContaining({ type: "PING" })
      );
    });
  });

  it("deve descartar documento", async () => {
    const { result } = renderHook(() => usePJeDocumentSync());

    // Aguardar inicialização para evitar warnings
    await waitFor(() => {
      expect(chromeMock.tabs.query).toHaveBeenCalled();
    });

    act(() => {
      result.current.descartarDocumento("doc-123");
    });

    // Como não temos documentos iniciais, apenas verificamos se não quebra
    expect(result.current.documentosPendentes).toEqual([]);
  });

  it("deve processar mensagem SYNC_DOCUMENTO", async () => {
    const { result } = renderHook(() => usePJeDocumentSync());

    await waitFor(() => {
      expect(chromeMock.runtime.onMessage.addListener).toHaveBeenCalled();
    });

    const messageHandler = chromeMock.runtime.onMessage.addListener.mock.calls[0][0];
    const documento = {
      id: "doc-1",
      tipo: "certidao",
      conteudo: "Certidão de objeto e pé",
      metadados: {
        numeroProcesso: "1234567-89.2023.8.26.0100",
        dataEmissao: "2023-10-15",
      },
    };

    act(() => {
      messageHandler({
        type: "SYNC_DOCUMENTO",
        data: documento,
      });
    });

    await waitFor(() => {
      expect(result.current.documentosPendentes).toHaveLength(1);
      expect(result.current.documentosPendentes[0].id).toBe("doc-1");
    });
  });

  it("deve salvar documento e mover para processados", async () => {
    const { result } = renderHook(() => usePJeDocumentSync());

    await waitFor(() => {
      expect(chromeMock.tabs.query).toHaveBeenCalled();
    });

    const documento = {
      id: "doc-2",
      tipo: "sentenca",
      conteudo: "Sentença proferida",
      metadados: {
        numeroProcesso: "9876543-21.2023.5.02.0001",
      },
    };

    // Adicionar documento aos pendentes primeiro
    const messageHandler = chromeMock.runtime.onMessage.addListener.mock.calls[0][0];
    act(() => {
      messageHandler({
        type: "SYNC_DOCUMENTO",
        data: documento,
      });
    });

    await waitFor(() => {
      expect(result.current.documentosPendentes).toHaveLength(1);
    });

    // Salvar documento
    await act(async () => {
      await result.current.salvarDocumento(documento);
    });

    await waitFor(() => {
      expect(result.current.documentosPendentes).toHaveLength(0);
      expect(result.current.documentosProcessados).toHaveLength(1);
    });

    expect(mockSetData).toHaveBeenCalled();
  });

  it("deve forçar sincronização quando solicitado", async () => {
    const { result } = renderHook(() => usePJeDocumentSync());

    await waitFor(() => {
      expect(chromeMock.tabs.query).toHaveBeenCalled();
    });

    chromeMock.tabs.sendMessage.mockResolvedValueOnce({ success: true });

    await act(async () => {
      await result.current.forcarSincronizacao();
    });

    expect(chromeMock.tabs.sendMessage).toHaveBeenCalledWith(
      123,
      expect.objectContaining({ type: "FORCE_SYNC" })
    );
  });
});
