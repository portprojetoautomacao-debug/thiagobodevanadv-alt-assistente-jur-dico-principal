import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock useKV hook to provide expedientes
const mockSetData = vi.fn();
vi.mock("./use-kv", () => ({
  useKV: () => [
    [
      {
        id: "e1",
        processId: "",
        numeroProcesso: "123.456.789-00",
        dataRecebimento: "2025-12-07T00:00:00.000Z",
        titulo: "EXPEDIENTE 1",
        conteudo: "Conteúdo",
        tipo: "documento",
        tribunal: "TJ",
        orgao: "Vara",
        source: "pje",
      },
    ],
    mockSetData,
  ],
}));

import { useTimelineSync } from "./use-timeline-sync";

describe("useTimelineSync", () => {
  it("should filter expedientes by processId using replaceAll", async () => {
    const { result } = renderHook(() => useTimelineSync({ processId: "12345678900" }));

    await waitFor(() => {
      expect(result.current.events.length).toBeGreaterThanOrEqual(0);
    });

    // The expedition will match after removing punctuation
    expect(result.current.expedientes.length).toBe(1);
  });
});
