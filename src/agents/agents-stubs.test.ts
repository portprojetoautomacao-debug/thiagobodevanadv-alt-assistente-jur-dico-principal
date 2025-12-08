import { runAnaliseDocumental } from "@/agents/analise-documental/analise_documental_graph";
import { runAnaliseRisco } from "@/agents/analise-risco/analise_risco_graph";
import { runComunicacaoClientes } from "@/agents/comunicacao-clientes/comunicacao_clientes_graph";
import { runEstrategiaProcessual } from "@/agents/estrategia-processual/estrategia_processual_graph";
import { runFinanceiro } from "@/agents/financeiro/financeiro_graph";
import { runGestaoPrazos } from "@/agents/gestao-prazos/gestao_prazos_graph";
import { runHarvey } from "@/agents/harvey/harvey_graph";
import { runJustine } from "@/agents/justine/justine_graph";
import { runOrganizacaoArquivos } from "@/agents/organizacao-arquivos/organizacao_arquivos_graph";
import { runPesquisaJuris } from "@/agents/pesquisa-juris/pesquisa_graph";
import { runRedacaoPeticoes } from "@/agents/redacao-peticoes/redacao_graph";
import { runRevisaoContratual } from "@/agents/revisao-contratual/revisao_contratual_graph";
import { runTraducaoJuridica } from "@/agents/traducao-juridica/traducao_juridica_graph";

import { describe, expect, test } from "vitest";

describe("LangGraph agent stubs (smoke tests)", () => {
  test("Harvey runs and completes", async () => {
    const result = await runHarvey();
    expect(result.completed).toBe(true);
  });

  test("Justine runs and completes", async () => {
    const result = await runJustine();
    expect(result.completed).toBe(true);
  });

  test("Analise Documental runs and completes", async () => {
    const result = await runAnaliseDocumental();
    expect(result.completed).toBe(true);
  });

  test("Gestao Prazos runs and completes", async () => {
    const result = await runGestaoPrazos();
    expect(result.completed).toBe(true);
  });

  test("Redacao Peticoes runs and completes", async () => {
    const result = await runRedacaoPeticoes();
    expect(result.completed).toBe(true);
  });

  test("Pesquisa Juris runs and completes", async () => {
    const result = await runPesquisaJuris();
    expect(result.completed).toBe(true);
  });

  test("Analise Risco runs and completes", async () => {
    const result = await runAnaliseRisco();
    expect(result.completed).toBe(true);
  });

  test("Revisao Contratual runs and completes", async () => {
    const result = await runRevisaoContratual();
    expect(result.completed).toBe(true);
  });

  test("Comunicacao Clientes runs and completes", async () => {
    const result = await runComunicacaoClientes();
    expect(result.completed).toBe(true);
  });

  test("Financeiro runs and completes", async () => {
    const result = await runFinanceiro();
    expect(result.completed).toBe(true);
  });

  test("Estrategia Processual runs and completes", async () => {
    const result = await runEstrategiaProcessual();
    expect(result.completed).toBe(true);
  });

  test("Traducao Juridica runs and completes", async () => {
    const result = await runTraducaoJuridica();
    expect(result.completed).toBe(true);
  });

  test("Organizacao de Arquivos runs and completes", async () => {
    const result = await runOrganizacaoArquivos();
    expect(result.completed).toBe(true);
  });
});
