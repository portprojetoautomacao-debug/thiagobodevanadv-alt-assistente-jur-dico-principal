import { describe, it, expect } from "vitest";
import { minutasToProcessEvents, createProcessTimeline } from "./process-timeline-utils";

describe("process-timeline-utils", () => {
  it("minutasToProcessEvents should mark source as ia when criadoPorAgente is true", () => {
    const minutas = [
      {
        id: "m1",
        processId: "p1",
        criadoEm: "2025-12-07T00:00:00.000Z",
        titulo: "Minuta IA",
        conteudo: "Conteúdo gerado",
        tipo: "peticao",
        criadoPorAgente: true,
        googleDocsUrl: undefined,
      },
      {
        id: "m2",
        processId: "p1",
        criadoEm: "2025-12-06T00:00:00.000Z",
        titulo: "Minuta manual",
        conteudo: "Conteúdo manual",
        tipo: "peticao",
        criadoPorAgente: false,
        googleDocsUrl: undefined,
      },
    ];

    const events = minutasToProcessEvents(minutas as any);
    expect(events[0].source).toBe("ia");
    expect(events[1].source).toBe("manual");
  });

  it("createProcessTimeline should order events by dataHora (desc)", () => {
    const minutas = [
      {
        id: "m1",
        processId: "p1",
        criadoEm: "2025-12-07T00:00:00.000Z",
        titulo: "A",
        conteudo: "a",
        tipo: "peticao",
        googleDocsUrl: undefined,
        criadoPorAgente: true,
        minutaId: "m1",
      },
      {
        id: "m2",
        processId: "p1",
        criadoEm: "2025-12-06T00:00:00.000Z",
        titulo: "B",
        conteudo: "b",
        tipo: "peticao",
        googleDocsUrl: undefined,
        criadoPorAgente: false,
        minutaId: "m2",
      },
    ];

    const timeline = createProcessTimeline([], minutas as any);
    expect(timeline[0].id).toBe("m1");
    expect(timeline[1].id).toBe("m2");
  });
});
