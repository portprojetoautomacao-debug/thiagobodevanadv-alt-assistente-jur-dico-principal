/**
 * Testes de substituição de variáveis no editor
 */
import { describe, expect, it } from "vitest";

describe("Variable Substitution", () => {
  function replaceVariables(text: string, vars: Record<string, string>): string {
    let result = text;
    Object.entries(vars).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
      result = result.replace(regex, value);
    });
    return result;
  }

  it("should replace single variable", () => {
    const text = "Cliente: {{nome_cliente}}";
    const vars = { nome_cliente: "João Silva" };
    const result = replaceVariables(text, vars);

    expect(result).toBe("Cliente: João Silva");
  });

  it("should replace multiple variables", () => {
    const text = "{{nome_cliente}}, CPF {{cpf}}, residente em {{cidade}}";
    const vars = {
      nome_cliente: "João Silva",
      cpf: "123.456.789-00",
      cidade: "São Paulo",
    };
    const result = replaceVariables(text, vars);

    expect(result).toBe("João Silva, CPF 123.456.789-00, residente em São Paulo");
  });

  it("should handle variables with spaces", () => {
    const text = "{{ nome_cliente }} mora em {{ cidade }}";
    const vars = { nome_cliente: "Maria", cidade: "Rio" };
    const result = replaceVariables(text, vars);

    expect(result).toBe("Maria mora em Rio");
  });

  it("should keep unmatched variables", () => {
    const text = "Cliente: {{nome_cliente}}, Email: {{email}}";
    const vars = { nome_cliente: "João" };
    const result = replaceVariables(text, vars);

    expect(result).toContain("João");
    expect(result).toContain("{{email}}");
  });
});
