import { describe, it, expect } from "vitest";
import { processSchema, type Process } from "../process.schema";

describe("processSchema", () => {
  it("should validate a correct process object", () => {
    const validProcess: Process = {
      id: "proc_123",
      numero: "1234567-89.2024.5.02.0999",
      titulo: "Ação Trabalhista",
      partes: {
        autor: "João Silva",
        reu: "Empresa XYZ Ltda",
      },
      status: "em-andamento",
      vara: "1ª Vara do Trabalho de São Paulo",
      comarca: "São Paulo",
      tags: ["trabalhista", "rescisão"],
      criadoEm: "2024-12-08",
      atualizadoEm: "2024-12-08",
    };

    expect(() => processSchema.parse(validProcess)).not.toThrow();
  });

  it("should throw on missing required fields", () => {
    const invalidProcess = {
      id: "proc_123",
      // numero missing
      titulo: "Test",
    };

    expect(() => processSchema.parse(invalidProcess)).toThrow();
  });

  it("should validate numero CNJ format", () => {
    const validNumeros = [
      "1234567-89.2024.5.02.0999",
      "0000001-00.2024.8.01.0001",
      "9999999-99.2099.1.99.9999",
    ];

    validNumeros.forEach((numero) => {
      const process = {
        id: "proc_test",
        numero,
        titulo: "Test Process",
      };

      expect(() => processSchema.parse(process)).not.toThrow();
    });
  });

  it("should throw on invalid numero CNJ format", () => {
    const invalidNumeros = [
      "123456",
      "1234567-89.2024",
      "invalid-format",
      "1234567-89.2024.5.02",
    ];

    invalidNumeros.forEach((numero) => {
      const process = {
        id: "proc_test",
        numero,
        titulo: "Test Process",
      };

      expect(() => processSchema.parse(process)).toThrow();
    });
  });

  it("should validate all status values", () => {
    const statuses = ["ativo", "em-andamento", "suspenso", "arquivado", "concluído"];

    statuses.forEach((status) => {
      const process = {
        id: `proc_${status}`,
        numero: "1234567-89.2024.5.02.0999",
        titulo: "Test",
        status,
      };

      expect(() => processSchema.parse(process)).not.toThrow();
    });
  });

  it("should accept process without optional fields", () => {
    const minimalProcess = {
      id: "proc_min",
      numero: "1234567-89.2024.5.02.0999",
      titulo: "Minimal Process",
    };

    expect(() => processSchema.parse(minimalProcess)).not.toThrow();
  });

  it("should validate with all optional fields", () => {
    const fullProcess = {
      id: "proc_full",
      numero: "1234567-89.2024.5.02.0999",
      titulo: "Full Process",
      partes: {
        autor: "Autor Name",
        reu: "Reu Name",
        terceiros: ["Terceiro 1", "Terceiro 2"],
      },
      status: "em-andamento",
      vara: "1ª Vara Cível",
      comarca: "São Paulo",
      tags: ["tag1", "tag2"],
      valor: "R$ 50.000,00",
      dataDistribuicao: "2024-01-15",
      ultimaMovimentacao: "2024-12-08",
      criadoEm: "2024-01-15",
      atualizadoEm: "2024-12-08",
    };

    expect(() => processSchema.parse(fullProcess)).not.toThrow();
  });
});
