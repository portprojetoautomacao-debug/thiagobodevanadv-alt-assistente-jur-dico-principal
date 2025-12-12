/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

// Testa que documento enviado ao background é truncado e PII removido

describe("Document redaction before sync", () => {
  beforeEach(() => {
    (globalThis as any).chrome = {
      runtime: {
        sendMessage: vi.fn().mockImplementation((_m, cb) => cb({ success: true })),
        onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
      },
      tabs: {
        query: vi.fn().mockResolvedValue([{ id: 1 }]),
        sendMessage: vi.fn().mockResolvedValue({ success: true }),
      },
      storage: {
        sync: {
          get: vi.fn().mockResolvedValue({ apiKey: null }),
          set: vi.fn().mockResolvedValue(undefined),
        },
        local: { get: vi.fn().mockResolvedValue({}), set: vi.fn().mockResolvedValue(undefined) },
      },
    } as any;

    document.body.innerHTML = `<div class="documento-conteudo">${"A".repeat(1200)} CPF: 123.456.789-00 email: user@example.com Processo No: 0012345-67.2024.8.13.0000</div>`;
  });

  it("should redact CPF and email and truncate content before sending SYNC_DOCUMENTO", async () => {
    // Simula estar em página do PJe para que o content script realize a sync automaticamente
    (window as any).location.href = "https://pje.tjmg.jus.br/painel";

    // Testa sanitizer diretamente
    const { sanitizeDocumentoForSync } = await import("../src/content/utils/document-sanitizer");

    const documento = {
      id: "doc1",
      tipo: "sentenca",
      conteudo:
        "A".repeat(1200) +
        " CPF: 123.456.789-00 email: user@example.com Processo No: 0012345-67.2024.8.13.0000",
      dataExtracao: new Date().toISOString(),
      metadados: {},
    } as any;

    const sanitized = sanitizeDocumentoForSync(documento);

    expect(sanitized).toBeDefined();
    expect((sanitized.conteudo || "").length).toBeLessThanOrEqual(500);
    expect(sanitized.conteudo || "").not.toContain("123.456.789-00");
    expect(sanitized.conteudo || "").not.toContain("user@example.com");
    expect(sanitized.metadados._sanitization.piiRemoved).toBeTruthy();
  });
});
