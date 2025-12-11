/**
 * Redaction Service Tests
 *
 * Testes unitários para validar conformidade LGPD
 */

import { describe, it, expect, beforeEach } from "vitest";
import { redactionService, createRedactionService } from "./redaction-service";

describe("RedactionService", () => {
  beforeEach(() => {
    // Reset para configuração padrão
    redactionService.setConfig({
      mode: "none",
      enabled: false,
    });
  });

  describe("Configuration", () => {
    it("should start with redaction disabled by default", () => {
      expect(redactionService.isEnabled()).toBe(false);
    });

    it("should allow enabling redaction", () => {
      redactionService.setConfig({ enabled: true });
      expect(redactionService.isEnabled()).toBe(true);
    });

    it("should allow setting global redaction mode", () => {
      redactionService.setConfig({ mode: "partial", enabled: true });
      const config = redactionService.getConfig();
      expect(config.mode).toBe("partial");
    });

    it("should allow creating custom instance", () => {
      const customService = createRedactionService({
        mode: "complete",
        enabled: true,
      });
      expect(customService.isEnabled()).toBe(true);
      expect(customService.getConfig().mode).toBe("complete");
    });
  });

  describe("Name Redaction", () => {
    it("should not redact when disabled", () => {
      const name = "João da Silva Santos";
      expect(redactionService.redactName(name)).toBe(name);
    });

    it("should partially redact name", () => {
      redactionService.setConfig({ names: "partial", enabled: true });
      expect(redactionService.redactName("João da Silva Santos")).toBe("João S.");
      expect(redactionService.redactName("Maria Oliveira")).toBe("Maria O.");
    });

    it("should completely redact name", () => {
      redactionService.setConfig({ names: "complete", enabled: true });
      expect(redactionService.redactName("João da Silva")).toBe("[NOME_REDACTED]");
    });

    it("should not redact single names", () => {
      redactionService.setConfig({ names: "partial", enabled: true });
      expect(redactionService.redactName("João")).toBe("João");
    });
  });

  describe("CPF Redaction", () => {
    it("should not redact when disabled", () => {
      const cpf = "123.456.789-01";
      expect(redactionService.redactCPF(cpf)).toBe(cpf);
    });

    it("should partially redact CPF", () => {
      redactionService.setConfig({ cpf: "partial", enabled: true });
      expect(redactionService.redactCPF("123.456.789-01")).toBe("12*.***.*89-**");
      expect(redactionService.redactCPF("12345678901")).toBe("12*.***.*89-**");
    });

    it("should completely redact CPF", () => {
      redactionService.setConfig({ cpf: "complete", enabled: true });
      expect(redactionService.redactCPF("123.456.789-01")).toBe("[CPF_REDACTED]");
    });

    it("should not redact invalid CPF", () => {
      redactionService.setConfig({ cpf: "partial", enabled: true });
      expect(redactionService.redactCPF("123.456")).toBe("123.456");
    });
  });

  describe("CNPJ Redaction", () => {
    it("should not redact when disabled", () => {
      const cnpj = "12.345.678/0001-90";
      expect(redactionService.redactCNPJ(cnpj)).toBe(cnpj);
    });

    it("should partially redact CNPJ", () => {
      redactionService.setConfig({ cnpj: "partial", enabled: true });
      expect(redactionService.redactCNPJ("12.345.678/0001-90")).toBe("12.***.678/****-**");
      expect(redactionService.redactCNPJ("12345678000190")).toBe("12.***.678/****-**");
    });

    it("should completely redact CNPJ", () => {
      redactionService.setConfig({ cnpj: "complete", enabled: true });
      expect(redactionService.redactCNPJ("12.345.678/0001-90")).toBe("[CNPJ_REDACTED]");
    });
  });

  describe("Telefone Redaction", () => {
    it("should not redact when disabled", () => {
      const tel = "(11) 98765-4321";
      expect(redactionService.redactTelefone(tel)).toBe(tel);
    });

    it("should partially redact telefone", () => {
      redactionService.setConfig({ telefone: "partial", enabled: true });
      expect(redactionService.redactTelefone("(11) 98765-4321")).toBe("(11) *****-4321");
      expect(redactionService.redactTelefone("11987654321")).toBe("(11) *****-4321");
    });

    it("should completely redact telefone", () => {
      redactionService.setConfig({ telefone: "complete", enabled: true });
      expect(redactionService.redactTelefone("(11) 98765-4321")).toBe("[TELEFONE_REDACTED]");
    });
  });

  describe("Email Redaction", () => {
    it("should not redact when disabled", () => {
      const email = "joao.silva@empresa.com.br";
      expect(redactionService.redactEmail(email)).toBe(email);
    });

    it("should partially redact email", () => {
      redactionService.setConfig({ email: "partial", enabled: true });
      expect(redactionService.redactEmail("joao.silva@empresa.com.br")).toBe("j***@empresa.com.br");
      expect(redactionService.redactEmail("a@test.com")).toBe("a***@test.com");
    });

    it("should completely redact email", () => {
      redactionService.setConfig({ email: "complete", enabled: true });
      expect(redactionService.redactEmail("joao@test.com")).toBe("[EMAIL_REDACTED]");
    });
  });

  describe("Endereco Redaction", () => {
    it("should not redact when disabled", () => {
      const endereco = "Rua das Flores, 123, Apto 45, São Paulo/SP";
      expect(redactionService.redactEndereco(endereco)).toBe(endereco);
    });

    it("should partially redact endereco", () => {
      redactionService.setConfig({ endereco: "partial", enabled: true });
      const redacted = redactionService.redactEndereco("Rua das Flores, 123, Apto 45, São Paulo/SP");
      expect(redacted).toContain("Rua das Flores");
      expect(redacted).toContain("São Paulo/SP");
      expect(redacted).not.toContain("123");
      expect(redacted).not.toContain("Apto 45");
    });

    it("should completely redact endereco", () => {
      redactionService.setConfig({ endereco: "complete", enabled: true });
      expect(redactionService.redactEndereco("Rua X, 123")).toBe("[ENDERECO_REDACTED]");
    });
  });

  describe("Text Redaction", () => {
    it("should not redact when disabled", () => {
      const text = "João Silva, CPF 123.456.789-01, tel (11) 98765-4321";
      const result = redactionService.redactText(text);
      expect(result.redactedText).toBe(text);
      expect(result.redactionsApplied).toHaveLength(0);
    });

    it("should redact multiple types in text", () => {
      redactionService.setConfig({ mode: "partial", enabled: true });
      const text = "Contato: João Silva, CPF 123.456.789-01, email joao@test.com, tel (11) 98765-4321";
      const result = redactionService.redactText(text);

      expect(result.redactedText).toContain("12*.***.*89-**"); // CPF
      expect(result.redactedText).toContain("j***@test.com"); // Email
      expect(result.redactedText).toContain("(11) *****-4321"); // Telefone
      expect(result.redactionsApplied.length).toBeGreaterThan(0);
    });

    it("should track redaction counts", () => {
      redactionService.setConfig({ mode: "partial", enabled: true });
      const text = "CPF: 123.456.789-01 e 987.654.321-00";
      const result = redactionService.redactText(text);

      const cpfRedaction = result.redactionsApplied.find((r) => r.type === "CPF");
      expect(cpfRedaction?.count).toBe(2);
    });

    it("should handle CNPJ in text", () => {
      redactionService.setConfig({ mode: "partial", enabled: true });
      const text = "CNPJ da empresa: 12.345.678/0001-90";
      const result = redactionService.redactText(text);

      expect(result.redactedText).toContain("12.***.678/****-**");
      expect(result.redactionsApplied.some((r) => r.type === "CNPJ")).toBe(true);
    });
  });

  describe("Object Redaction", () => {
    it("should not redact when disabled", () => {
      const obj = { nome: "João", cpf: "123.456.789-01" };
      const redacted = redactionService.redactObject(obj);
      expect(redacted).toEqual(obj);
    });

    it("should redact string fields", () => {
      redactionService.setConfig({ mode: "partial", enabled: true });
      const obj = { nome: "João", cpf: "123.456.789-01", email: "joao@test.com" };
      const redacted = redactionService.redactObject(obj);

      expect(redacted.cpf).toBe("12*.***.*89-**");
      expect(redacted.email).toBe("j***@test.com");
    });

    it("should redact nested objects", () => {
      redactionService.setConfig({ mode: "partial", enabled: true });
      const obj = {
        pessoa: {
          nome: "João",
          cpf: "123.456.789-01",
          contato: {
            email: "joao@test.com",
          },
        },
      };
      const redacted = redactionService.redactObject(obj);

      expect(redacted.pessoa.cpf).toBe("12*.***.*89-**");
      expect(redacted.pessoa.contato.email).toBe("j***@test.com");
    });

    it("should redact arrays", () => {
      redactionService.setConfig({ mode: "partial", enabled: true });
      const obj = {
        cpfs: ["123.456.789-01", "987.654.321-00"],
      };
      const redacted = redactionService.redactObject(obj);

      expect(redacted.cpfs[0]).toBe("12*.***.*89-**");
      expect(redacted.cpfs[1]).toBe("98*.***.*21-**");
    });

    it("should preserve non-string types", () => {
      redactionService.setConfig({ mode: "partial", enabled: true });
      const obj = {
        nome: "João",
        idade: 30,
        ativo: true,
        nulo: null,
        indefinido: undefined,
      };
      const redacted = redactionService.redactObject(obj);

      expect(redacted.idade).toBe(30);
      expect(redacted.ativo).toBe(true);
      expect(redacted.nulo).toBe(null);
      expect(redacted.indefinido).toBe(undefined);
    });
  });

  describe("LGPD Compliance", () => {
    it("should comply with LGPD Art. 5º, I (dados pessoais)", () => {
      redactionService.setConfig({ mode: "partial", enabled: true });

      // CPF
      expect(redactionService.redactCPF("123.456.789-01")).not.toBe("123.456.789-01");

      // Email
      expect(redactionService.redactEmail("joao@test.com")).not.toBe("joao@test.com");

      // Telefone
      expect(redactionService.redactTelefone("(11) 98765-4321")).not.toBe("(11) 98765-4321");
    });

    it("should allow full anonymization when required", () => {
      redactionService.setConfig({ mode: "complete", enabled: true });

      expect(redactionService.redactName("João Silva")).toBe("[NOME_REDACTED]");
      expect(redactionService.redactCPF("123.456.789-01")).toBe("[CPF_REDACTED]");
      expect(redactionService.redactEmail("joao@test.com")).toBe("[EMAIL_REDACTED]");
    });

    it("should allow disabling redaction for internal use", () => {
      redactionService.setConfig({ mode: "none", enabled: false });

      const text = "João Silva, CPF 123.456.789-01";
      const result = redactionService.redactText(text);

      expect(result.redactedText).toBe(text);
    });
  });
});
