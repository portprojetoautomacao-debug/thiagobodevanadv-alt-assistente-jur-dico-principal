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

import { Redis } from '@upstash/redis'
import { captureError, captureMessage, trackMetric, withSpan } from '../services/error-tracking'
import { AgentStatus } from './agents'

// ============================================================================
// REDIS HELPER
// ============================================================================

const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim()
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()

let _redisClient: Redis | null = null

function getRedisOrNull(): Redis | null {
    if (!redisUrl || !redisToken) return null
    if (!_redisClient) {
        _redisClient = new Redis({
            url: redisUrl,
            token: redisToken
        })
    }
    return _redisClient
}

export interface AgentActionLog {
    agentId: string
    action: string
    details?: Record<string, unknown>
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
        details?: Record<string, unknown>,
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

        // Persistir no Redis (apenas se estiver disponível)
        const redis = getRedisOrNull()
        if (redis) {
            try {
                // Buscar logs existentes
                const existingLogs = await redis.get('agent-logs') as AgentActionLog[] | null
                const logs = existingLogs || []

                // Manter apenas os últimos 50 logs para não estourar o limite
                const newLogs = [log, ...logs].slice(0, 50)
                await redis.set('agent-logs', newLogs)
            } catch (error) {
                console.error('[AgentMonitor] Failed to persist log to Redis', error)
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
