/**
 * Testes de sincronização automática entre valor e valorCausa
 *
 * Este teste valida a correção do bug crítico onde:
 * - UI criava processos com apenas "valor"
 * - Agentes de IA liam apenas "valorCausa"
 * - Resultado: análise de risco incorreta
 */

import { describe, expect, it } from "vitest";
import { processSchema } from "../process.schema";

describe("Sincronização valor ↔ valorCausa", () => {
  it("deve sincronizar valor → valorCausa quando apenas valor é fornecido", () => {
    const input = {
      id: "123",
      numeroCNJ: "1234567-89.2023.8.26.0100",
      titulo: "Processo Teste",
      autor: "João Silva",
      reu: "Maria Santos",
      status: "ativo" as const,
      valor: 150000, // UI fornece apenas valor
      // valorCausa não fornecido
      dataDistribuicao: new Date().toISOString(),
      dataUltimaMovimentacao: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = processSchema.parse(input);

    // Verificar que ambos os campos estão sincronizados
    expect(result.valor).toBe(150000);
    expect(result.valorCausa).toBe(150000); // ✅ Sincronizado automaticamente
  });

  it("deve sincronizar valorCausa → valor quando apenas valorCausa é fornecido", () => {
    const input = {
      id: "456",
      numeroCNJ: "7654321-98.2023.5.02.0001",
      titulo: "Processo PJe",
      autor: "Pedro Oliveira",
      reu: "Empresa XYZ Ltda",
      status: "ativo" as const,
      // valor não fornecido
      valorCausa: 95000, // Extension PJe fornece apenas valorCausa
      dataDistribuicao: new Date().toISOString(),
      dataUltimaMovimentacao: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = processSchema.parse(input);

    // Verificar que ambos os campos estão sincronizados
    expect(result.valorCausa).toBe(95000);
    expect(result.valor).toBe(95000); // ✅ Sincronizado automaticamente
  });

  it("deve manter ambos os valores quando ambos são fornecidos", () => {
    const input = {
      id: "789",
      numeroCNJ: "9999999-99.2024.4.03.0000",
      titulo: "Processo com ambos",
      autor: "Ana Costa",
      reu: "José Pereira",
      status: "ativo" as const,
      valor: 200000,
      valorCausa: 200000, // Ambos fornecidos com mesmo valor
      dataDistribuicao: new Date().toISOString(),
      dataUltimaMovimentacao: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = processSchema.parse(input);

    // Verificar que nenhum valor foi alterado
    expect(result.valor).toBe(200000);
    expect(result.valorCausa).toBe(200000);
  });

  it("deve funcionar quando nenhum valor é fornecido", () => {
    const input = {
      id: "999",
      numeroCNJ: "5555555-55.2024.1.01.0001",
      titulo: "Processo sem valor",
      autor: "Carlos Mendes",
      reu: "Fernanda Lima",
      status: "ativo" as const,
      // Nenhum valor fornecido
      dataDistribuicao: new Date().toISOString(),
      dataUltimaMovimentacao: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = processSchema.parse(input);

    // Verificar que ambos permanecem undefined
    expect(result.valor).toBeUndefined();
    expect(result.valorCausa).toBeUndefined();
  });

  /**
   * Cenário do bug original:
   * 1. Usuário cria processo via UI com valor R$ 150.000,00
   * 2. UI salva apenas campo "valor"
   * 3. Agente de análise de risco lê apenas campo "valorCausa"
   * 4. Agente recebe 0 ao invés de 150.000
   * 5. Análise de risco fica incorreta (não aplica ajuste +0.1 para valores > 100k)
   *
   * Com a correção, o transform sincroniza automaticamente:
   * - Se UI envia valor=150000, transform copia para valorCausa=150000
   * - Agente agora lê valorCausa=150000 corretamente
   */
  it("BUG FIX: deve corrigir análise de risco para processo criado via UI", () => {
    // Simula processo criado via UI (apenas valor)
    const processoUI = {
      id: "bug-fix-test",
      numeroCNJ: "1234567-89.2024.8.09.0000",
      titulo: "Ação Trabalhista - Alto Valor",
      autor: "Trabalhador X",
      reu: "Empresa Y",
      status: "ativo" as const,
      valor: 150000, // UI envia apenas valor
      dataDistribuicao: new Date().toISOString(),
      dataUltimaMovimentacao: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = processSchema.parse(processoUI);

    // ANTES DA CORREÇÃO: valorCausa era undefined
    // DEPOIS DA CORREÇÃO: valorCausa sincronizado automaticamente
    expect(result.valorCausa).toBe(150000);

    // Simula lógica do agente de análise de risco
    const valorCausa = result.valorCausa || 0;
    let riskScore = 0.5; // Base score

    // ANTES: valorCausa era 0, então não entrava neste if
    // DEPOIS: valorCausa é 150000, então aplica ajuste +0.1
    if (valorCausa > 100000) {
      riskScore += 0.1;
    }

    // Verificar que o risco foi calculado corretamente
    expect(riskScore).toBe(0.6); // ✅ 0.5 + 0.1 = 0.6
  });

  it("BUG FIX: deve corrigir processo importado do PJe via Chrome Extension", () => {
    // Simula processo extraído pelo crawler do PJe (apenas valorCausa)
    const processoPJe = {
      id: "pje-import-test",
      numeroCNJ: "7654321-98.2024.5.02.0001",
      titulo: "Processo do PJe",
      autor: "Autor PJe",
      reu: "Réu PJe",
      status: "ativo" as const,
      valorCausa: 95000, // Extension extrai apenas valorCausa
      dataDistribuicao: new Date().toISOString(),
      dataUltimaMovimentacao: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = processSchema.parse(processoPJe);

    // ANTES DA CORREÇÃO: valor era undefined, UI mostrava vazio
    // DEPOIS DA CORREÇÃO: valor sincronizado automaticamente
    expect(result.valor).toBe(95000);
    expect(result.valorCausa).toBe(95000);

    // UI agora consegue exibir o valor corretamente
    const valorFormatado = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(result.valor!);

    // Verificar que valor foi formatado (independente de espaços invisíveis)
    expect(valorFormatado).toContain("95.000,00");
  });
});
