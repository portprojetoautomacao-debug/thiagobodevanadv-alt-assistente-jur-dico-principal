/**
 * Exemplo de Uso do Kimi K2 Thinking Service
 *
 * Este arquivo demonstra como usar o modelo Kimi-K2-Thinking
 * para análise complexa, revisão de código e debug
 */

import { kimiService } from "./kimi-service";

/**
 * Exemplo 1: Análise Jurídica Complexa
 */
export async function exemploAnaliseJuridica() {
  const caseDescription = `
    Processo nº 1234567-89.2024.8.26.0100
    Reclamante: João Silva
    Reclamada: Empresa X Ltda
    Assunto: Rescisão indireta por falta de pagamento de verbas rescisórias

    Histórico:
    - Empregado trabalhou por 5 anos
    - Dispensado sem justa causa em 01/01/2024
    - Empresa não pagou aviso prévio e férias vencidas
    - Empregado pleiteia rescisão indireta retroativa a 01/12/2023
  `;

  const question = `
    Considerando os precedentes do TST, qual a melhor estratégia:
    1. Aceitar a rescisão sem justa causa e cobrar verbas em execução?
    2. Pleitear rescisão indireta com danos morais?
    3. Propor acordo incluindo indenização adicional?
  `;

  const analysis = await kimiService.analyzeComplexLegalCase(caseDescription, question);

  console.log("=== ANÁLISE KIMI K2 ===");
  console.log(analysis);
}

/**
 * Exemplo 2: Revisão de Código TypeScript
 */
export async function exemploRevisaoCodigo() {
  const code = `
    export function processarIntimacao(expediente: any) {
      const prazo = expediente.prazo;
      const intimacao = expediente.conteudo.split('Intimação')[1];

      if (prazo > 0) {
        return {
          tipo: 'intimacao',
          prazo: prazo,
          conteudo: intimacao
        };
      }
    }
  `;

  const context = `
    Este código faz parte do sistema de análise automática de intimações.
    Requisitos:
    - Deve ser type-safe (TypeScript strict)
    - Validar todos os inputs
    - Tratar erros gracefully
    - Seguir padrões do projeto (ver .github/copilot-instructions.md)
  `;

  const review = await kimiService.reviewCode(code, "typescript", context);

  console.log("=== REVISÃO KIMI K2 ===");
  console.log(review);
}

/**
 * Exemplo 3: Debug de Erro Complexo
 */
export async function exemploDebugErro() {
  const errorMessage = `
    TypeError: Cannot read properties of undefined (reading 'prazo')
    at processarExpediente (expedientes.ts:45)
  `;

  const code = `
    async function processarExpediente(id: string) {
      const expediente = await getExpediente(id);
      const prazoFinal = calcularPrazo(expediente.prazo, expediente.dataPublicacao);

      return {
        id: expediente.id,
        prazo: prazoFinal,
        urgente: prazoFinal < 5
      };
    }
  `;

  const stackTrace = `
    at processarExpediente (src/lib/expedientes.ts:45:52)
    at async AgentProcessor.process (src/agents/processor.ts:123:18)
    at async runAgent (src/hooks/use-autonomous-agents.ts:234:12)
  `;

  const debug = await kimiService.debugIssue(errorMessage, code, stackTrace);

  console.log("=== DEBUG KIMI K2 ===");
  console.log(debug);
}

/**
 * Exemplo 4: Estratégia Processual Multi-Opções
 */
export async function exemploEstrategiaProcessual() {
  const processInfo = {
    numero: "0001234-56.2024.5.02.0001",
    parte: "Empregado X vs Empresa Y",
    assunto: "Horas extras não pagas + adicional noturno",
    situacao: "Contestação apresentada pela empresa negando tudo",
  };

  const goal = `
    Maximizar chances de êxito com custos processuais controlados.
    Cliente tem recursos limitados e precisa de resultado em até 12 meses.
  `;

  const strategy = await kimiService.generateLegalStrategy(processInfo, goal);

  console.log("=== ESTRATÉGIA KIMI K2 ===");
  console.log(strategy);
}

/**
 * Exemplo 5: Integração com Agentes Existentes
 */
export async function integracaoComAgentes() {
  // Usar Kimi K2 para análise complexa que Mrs. Justin-e delega
  const intimacaoComplexa = {
    conteudo: "Intimação para manifestação sobre questão processual complexa...",
    processo: "1234567-89.2024.8.26.0100",
  };

  // Mrs. Justin-e detecta que precisa de análise profunda
  if (intimacaoComplexa.conteudo.includes("complexa")) {
    console.log("🧠 Delegando para Kimi K2 Thinking...");

    const analise = await kimiService.analyzeComplexLegalCase(
      `Processo ${intimacaoComplexa.processo}`,
      intimacaoComplexa.conteudo
    );

    console.log("✅ Análise profunda concluída:");
    console.log(analise);

    // Retornar para Mrs. Justin-e criar tarefas baseadas na análise
    return {
      requer_analise_humana: true,
      analise_kimi: analise,
      recomendacao: "Consultar advogado sênior",
    };
  }
}

// Exportar todos os exemplos
export const kimiExamples = {
  exemploAnaliseJuridica,
  exemploRevisaoCodigo,
  exemploDebugErro,
  exemploEstrategiaProcessual,
  integracaoComAgentes,
};
