/**
 * @fileoverview Documentação da API Interna - Guia de Referência
 * 
 * Este arquivo documenta as APIs internas mais usadas do sistema,
 * facilitando o desenvolvimento e manutenção.
 * 
 * @author Assistente Jurídico PJe Team
 * @version 1.0.0
 */

/**
 * ======================
 * HOOKS PRINCIPAIS
 * ======================
 */

/**
 * Hook para gestão de processos com validação Zod
 * 
 * @example
 * ```typescript
 * const { processes, addProcess, updateProcess, deleteProcess } = useProcessesValidated();
 * 
 * // Adicionar processo (valida automaticamente)
 * const newProcess = addProcess({
 *   numeroCNJ: '1234567-89.2024.5.02.0999',
 *   titulo: 'Ação Trabalhista',
 *   autor: 'João Silva',
 *   reu: 'Empresa XYZ',
 *   status: 'ativo',
 * });
 * 
 * // Atualizar processo
 * updateProcess(newProcess.id, { status: 'concluido' });
 * ```
 * 
 * @returns {Object} Funções e estado de processos
 * @see src/hooks/use-processes-validated.ts
 */
export type UseProcessesValidated = ReturnType<typeof import("./hooks/use-processes-validated").useProcessesValidated>;

/**
 * Hook para gestão de agentes IA autônomos
 * 
 * @example
 * ```typescript
 * const { agents, tasks, addTask, toggleAgent } = useAutonomousAgents();
 * 
 * // Criar tarefa para agente
 * addTask({
 *   id: crypto.randomUUID(),
 *   agentId: 'redacao-peticoes',
 *   type: 'draft_petition',
 *   priority: 'high',
 *   data: { processId: '123' }
 * });
 * ```
 * 
 * @see src/hooks/use-autonomous-agents.ts
 */
export type UseAutonomousAgents = ReturnType<typeof import("./hooks/use-autonomous-agents").useAutonomousAgents>;

/**
 * ======================
 * SERVIÇOS DE IA
 * ======================
 */

/**
 * Serviço de streaming de IA (Gemini 2.5 Pro)
 * 
 * @example
 * ```typescript
 * const { streamChat, isStreaming, streamingContent } = useAIStreaming({
 *   agentId: 'harvey-specter',
 *   sessionId: 'session-123',
 * });
 * 
 * const response = await streamChat([
 *   { role: 'system', content: 'Você é um assistente jurídico' },
 *   { role: 'user', content: 'Analise este processo' }
 * ]);
 * ```
 * 
 * @see src/hooks/use-ai-streaming.ts
 */
export type UseAIStreaming = ReturnType<typeof import("./hooks/use-ai-streaming").useAIStreaming>;

/**
 * ======================
 * INTEGRAÇÕES EXTERNAS
 * ======================
 */

/**
 * API do DJEN (Diário de Justiça Eletrônico Nacional)
 * 
 * @example
 * ```typescript
 * import { consultarDJENForLawyer } from '@/lib/api/djen-client';
 * 
 * const { resultados, erros } = await consultarDJENForLawyer(
 *   ['TJMG', 'TRT3'],
 *   'Thiago Bodevan Veiga',
 *   '184404',
 *   undefined,
 *   undefined,
 *   'D' // Diário Digital
 * );
 * ```
 * 
 * @see src/lib/api/djen-client.ts
 * @apiEndpoint https://comunicaapi.pje.jus.br/api/v1/comunicacao
 */

/**
 * ======================
 * SCHEMAS DE VALIDAÇÃO
 * ======================
 */

/**
 * Schema Zod para validação de processos
 * 
 * @example
 * ```typescript
 * import { processSchema, validateProcess } from '@/schemas/process.schema';
 * 
 * const validation = validateProcess(processData);
 * if (!validation.isValid) {
 *   console.error('Erros:', validation.errors);
 * } else {
 *   // validation.data é do tipo ProcessValidated
 *   saveProcess(validation.data);
 * }
 * ```
 * 
 * @see src/schemas/process.schema.ts
 */

/**
 * ======================
 * COMPONENTES UI
 * ======================
 */

/**
 * Skeleton Loaders - Componentes de loading profissionais
 * 
 * @example
 * ```typescript
 * import { ProcessCardSkeleton, DashboardSkeleton } from '@/components/ui/skeletons';
 * 
 * // Em loading states
 * {isLoading ? <ProcessCardSkeleton /> : <ProcessCard process={data} />}
 * ```
 * 
 * @see src/components/ui/skeletons.tsx
 */

/**
 * ======================
 * MONITORAMENTO
 * ======================
 */

/**
 * Sentry - Error Tracking e Performance Monitoring
 * 
 * @example
 * ```typescript
 * import { captureException, setUserContext } from '@/lib/monitoring';
 * 
 * // Após login
 * setUserContext({ id: user.id, email: user.email, role: 'advogado' });
 * 
 * // Capturar erro customizado
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   captureException(error, { processId: '123', action: 'create_petition' });
 * }
 * ```
 * 
 * @see src/lib/monitoring.ts
 * @compliance LGPD - Dados sensíveis são filtrados automaticamente
 */

/**
 * ======================
 * TIPOS PRINCIPAIS
 * ======================
 */

export type { Process, Prazo, Cliente, Minuta, FinancialEntry } from "./types";
export type { AgentTask, AgentCapability } from "./lib/agents";
export type { ProcessValidated, PrazoValidated } from "./schemas/process.schema";
