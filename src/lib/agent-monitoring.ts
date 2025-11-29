/**
 * Agent Monitoring - Sistema de Observabilidade para Agentes IA
 *
 * ============================================================================
 * PLANO MESTRE - FASE 4: Monitoramento e Observabilidade
 * ============================================================================
 * - Rastreamento de ações dos agentes
 * - Métricas de performance e sucesso
 * - Integração com Sentry para alertas
 */

import { AgentStatus } from './agents'
import { trackMetric, captureMessage, captureError, withSpan } from '../services/error-tracking'

export interface AgentActionLog {
    agentId: string
    action: string
    details?: Record<string, any>
    timestamp: string
    success: boolean
    durationMs?: number
}

export class AgentMonitor {
    private static instance: AgentMonitor

    private constructor() { }

    public static getInstance(): AgentMonitor {
        if (!AgentMonitor.instance) {
            AgentMonitor.instance = new AgentMonitor()
        }
        return AgentMonitor.instance
    }

    /**
     * Registra uma ação executada por um agente
     */
    public async logAction(
        agentId: string,
        action: string,
        details?: Record<string, any>,
        success: boolean = true,
        durationMs?: number
    ) {
        const log: AgentActionLog = {
            agentId,
            action,
            details,
            timestamp: new Date().toISOString(),
            success,
            durationMs
        }

        // Log no console (dev)
        console.log(`[AgentMonitor] ${agentId} -> ${action} (${success ? 'OK' : 'FAIL'})`, log)

        // Enviar métrica para Sentry
        trackMetric('agent_action_count', 1, { agentId, action, success: String(success) })

        if (durationMs) {
            trackMetric('agent_action_duration', durationMs, { agentId, action })
        }

        if (!success) {
            captureMessage(`Agent Action Failed: ${agentId} - ${action}`, 'warning')
        }

        // Persistir no KV (apenas se estiver no ambiente server-side com token)
        if (typeof process !== 'undefined' && process.env.GITHUB_TOKEN) {
            try {
                const sparkId = process.env.SPARK_ID || 'spark-default'
                const kvEndpoint = `https://api.github.com/spark/kv/agent-logs?sparkId=${sparkId}`

                // Primeiro buscar logs existentes
                const response = await fetch(kvEndpoint, {
                    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
                })

                let logs: AgentActionLog[] = []
                if (response.ok) {
                    const data = await response.json() as { value?: AgentActionLog[] }
                    logs = data.value || []
                }

                // Manter apenas os últimos 50 logs para não estourar o limite
                const newLogs = [log, ...logs].slice(0, 50)

                await fetch(kvEndpoint, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
                    },
                    body: JSON.stringify({ value: newLogs })
                })
            } catch (error) {
                console.error('[AgentMonitor] Failed to persist log to KV', error)
            }
        }
    }

    /**
     * Monitora a execução de uma tarefa
     */
    public async trackTaskExecution<T>(
        taskId: string,
        agentId: string,
        taskType: string,
        executionFn: () => Promise<T>
    ): Promise<T> {
        const startTime = performance.now()

        try {
            // Envolve a execução em um span do Sentry
            const result = await withSpan(
                `agent_task_${taskType}`,
                'agent.task',
                async () => await executionFn(),
                { agentId, taskId, taskType }
            )

            const duration = performance.now() - startTime
            await this.logAction(agentId, `execute_task_${taskType}`, { taskId }, true, duration)

            trackMetric('agent_task_success', 1, { agentId, taskType })

            return result
        } catch (error) {
            const duration = performance.now() - startTime
            await this.logAction(agentId, `execute_task_${taskType}`, { taskId, error }, false, duration)

            trackMetric('agent_task_failure', 1, { agentId, taskType })
            captureError(error instanceof Error ? error : new Error(String(error)), {
                agentId,
                taskId,
                taskType
            })

            throw error
        }
    }

    /**
     * Registra mudança de status do agente
     */
    public logStatusChange(agentId: string, oldStatus: AgentStatus, newStatus: AgentStatus) {
        console.log(`[AgentMonitor] ${agentId}: ${oldStatus} -> ${newStatus}`)
        trackMetric('agent_status_change', 1, { agentId, from: oldStatus, to: newStatus })
    }
}

export const agentMonitor = AgentMonitor.getInstance()
