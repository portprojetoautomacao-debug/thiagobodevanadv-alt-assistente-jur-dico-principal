import { describe, it, expect } from "vitest";
import { expedienteSchema, type Expediente } from "../expediente.schema";

describe("expedienteSchema", () => {
  it("should validate a correct expediente object", () => {
    const validExpediente: Expediente = {
      id: "exp_123",
      processId: "proc_456",
      tipo: "intimação",
      conteudo: "Conteúdo da intimação judicial",
      dataPublicacao: "2024-12-08",
      dataLeitura: "2024-12-08",
      status: "pendente",
      prioridade: "alta",
      prazo: "2024-12-20",
    };

    expect(() => expedienteSchema.parse(validExpediente)).not.toThrow();
  });

  it("should throw on invalid tipo", () => {
    const invalidExpediente = {
      id: "exp_123",
      processId: "proc_456",
      tipo: "invalid-type",
      conteudo: "Content",
      dataPublicacao: "2024-12-08",
    };

    expect(() => expedienteSchema.parse(invalidExpediente)).toThrow();
  });

  it("should throw on invalid status", () => {
    const invalidExpediente = {
      id: "exp_123",
      processId: "proc_456",
      tipo: "intimação",
      conteudo: "Content",
      dataPublicacao: "2024-12-08",
      status: "invalid-status",
    };

    expect(() => expedienteSchema.parse(invalidExpediente)).toThrow();
  });

  it("should accept expediente without optional fields", () => {
    const minimalExpediente = {
      id: "exp_123",
      processId: "proc_456",
      tipo: "despacho",
      conteudo: "Conteúdo do despacho",
      dataPublicacao: "2024-12-08",
    };

    expect(() => expedienteSchema.parse(minimalExpediente)).not.toThrow();
  });

  it("should validate all tipo values", () => {
    const tipos = ["intimação", "despacho", "decisão", "sentença", "acórdão", "outro"];

    tipos.forEach((tipo) => {
      const expediente = {
        id: `exp_${tipo}`,
        processId: "proc_123",
        tipo,
        conteudo: `Conteúdo ${tipo}`,
        dataPublicacao: "2024-12-08",
      };

      expect(() => expedienteSchema.parse(expediente)).not.toThrow();
    });
  });

  it("should validate all status values", () => {
    const statuses = ["pendente", "lido", "analisado", "processado", "arquivado"];

    statuses.forEach((status) => {
      const expediente = {
        id: `exp_${status}`,
        processId: "proc_123",
        tipo: "intimação",
        conteudo: "Content",
        dataPublicacao: "2024-12-08",
        status,
      };

      expect(() => expedienteSchema.parse(expediente)).not.toThrow();
    });
  });

  it("should validate all prioridade values", () => {
    const prioridades = ["baixa", "média", "alta", "urgente"];

    prioridades.forEach((prioridade) => {
      const expediente = {
        id: `exp_${prioridade}`,
        processId: "proc_123",
        tipo: "intimação",
        conteudo: "Content",
        dataPublicacao: "2024-12-08",
        prioridade,
      };

      expect(() => expedienteSchema.parse(expediente)).not.toThrow();
    });
  });
});
