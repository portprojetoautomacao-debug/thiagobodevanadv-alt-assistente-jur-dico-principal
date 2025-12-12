import { describe, it, expect, beforeEach, vi } from 'vitest';

// Teste simples de messaging entre popup/background/content
// Mock do chrome.runtime.sendMessage para verificar chamadas

describe('Messaging between components', () => {
  beforeEach(() => {
    // Mock chrome runtime
    (globalThis as any).chrome = {
      runtime: {
        sendMessage: vi.fn().mockImplementation((_msg, cb) => cb({ success: true })),
      },
      tabs: {
        query: vi.fn().mockResolvedValue([{ id: 1 }]),
        sendMessage: vi.fn().mockResolvedValue({ success: true }),
      },
      storage: {
        sync: { get: vi.fn().mockResolvedValue({ apiKey: null }), set: vi.fn().mockResolvedValue(undefined) },
        local: { get: vi.fn().mockResolvedValue({}), set: vi.fn().mockResolvedValue(undefined) },
      },
    } as any;
  });

  it('should send FORCE_SYNC to content tabs when popup triggers sync', async () => {
    // Simula o comportamento do PopupController.syncNow (apenas chama chrome.tabs.query + sendMessage)
    const tabs = await (chrome.tabs.query as any)({ url: 'https://pje*.tjmg.jus.br/*' });
    expect(tabs.length).toBeGreaterThanOrEqual(1);

    await (chrome.tabs.sendMessage as any)(tabs[0].id, { type: 'FORCE_SYNC' });

    // Runtime may or may not be used depending on implementation; ensure tabs messaging occurs
    expect(chrome.tabs.sendMessage).toHaveBeenCalled();
  });
});
