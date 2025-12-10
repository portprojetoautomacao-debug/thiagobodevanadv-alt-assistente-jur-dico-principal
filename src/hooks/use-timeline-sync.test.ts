import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTimelineSync } from "./use-timeline-sync";

// Mock useKV
vi.mock("./use-kv", () => ({
  useKV: () => [
    [
      {
        id: "1",
        processId: "123.456",
        numeroProcesso: "123.456",
        source: "djen",
      },
      {
        id: "2",
        processId: "999.999",
        numeroProcesso: "999.999",
        source: "djen",
      },
    ],
    vi.fn(),
  ],
}));

// Mock createProcessTimeline
vi.mock("@/lib/process-timeline-utils", () => ({
  createProcessTimeline: (expedientes: any[]) => expedientes.map((e) => ({ id: e.id, ...e })),
}));

describe("useTimelineSync", () => {
  it("deve filtrar expedientes ignorando formatação (replaceAll)", async () => {
    // Simula um processId com formatação diferente mas mesmos dígitos
    const { result } = renderHook(() =>
      useTimelineSync({ processId: "123456", autoRefresh: false })
    );

    // Aguardar processamento
    await waitFor(() => {
      expect(result.current.events.length).toBeGreaterThan(0);
    });

    // Deve encontrar o expediente "123.456" porque "123456" == "123456" (após replaceAll(/\D/g, ""))
    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].id).toBe("1");
  });

  it("deve retornar vazio se não houver match", async () => {
    const { result } = renderHook(() =>
      useTimelineSync({ processId: "000000", autoRefresh: false })
    );

    // Aguardar processamento
    await waitFor(() => {
      expect(result.current.events).toBeDefined();
    });

    expect(result.current.events).toHaveLength(0);
  });
});
