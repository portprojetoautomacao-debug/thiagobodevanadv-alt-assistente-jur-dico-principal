/**
 * Agent Tracing Integration
 * 
 * Integrates OpenTelemetry-compatible tracing with the AI Agents system.
 * Provides automatic instrumentation for agent execution and task processing.
 */

import {
  tracingService,
  type Span,
  type AgentSpan,
  type TraceContext,
  type SpanAttributes,
  withTracing
} from './tracing'
import type { Agent, AgentTask, AgentTaskResult } from './agents'

// ============================================================================
// AGENT EXECUTION TRACING
// ============================================================================

/**
 * Trace agent task execution
 */
export async function traceAgentTask<T>(
  agent: Agent,
  task: AgentTask,
  executor: (span: AgentSpan) => Promise<T>
): Promise<T> {
  const span = tracingService.startAgentSpan(agent.id, agent.name, {
    sessionId: `task-${task.id}`,
    attributes: {
      'task.id': task.id,
      'task.type': task.type,
      'task.priority': task.priority,
      'agent.type': agent.type,
      'agent.autonomy_level': 0
    }
  })

  try {
    // Add task start event
    tracingService.addEvent(span, 'task.started', {
      'task.data': JSON.stringify(task.data)
    })

    const result = await executor(span)

    // Add task completion event
    tracingService.addEvent(span, 'task.completed')
    
    await tracingService.endSpan(span, 'ok')
    return result

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    tracingService.recordException(span, err)
    await tracingService.endSpan(span, 'error', err.message)
    throw error
  }
}

/**
 * Trace agent tool usage
 */
export function traceToolUsage(
  agentSpan: AgentSpan,
  toolName: string,
  toolInput: unknown,
  toolOutput: unknown
): void {
  tracingService.addEvent(agentSpan, 'tool.used', {
    'tool.name': toolName,
    'tool.input': JSON.stringify(toolInput).substring(0, 500),
    'tool.output': JSON.stringify(toolOutput).substring(0, 500)
  })

  if (agentSpan.toolsUsed) {
    agentSpan.toolsUsed.push(toolName)
  }
}

/**
 * Trace agent step
 */
export function traceAgentStep(
  agentSpan: AgentSpan,
  stepNumber: number,
  stepDescription: string,
  attributes?: SpanAttributes
): void {
  agentSpan.stepNumber = stepNumber
  
  tracingService.addEvent(agentSpan, `step.${stepNumber}`, {
    'step.description': stepDescription,
    ...attributes
  })
}

// ============================================================================
// LLM CALL TRACING
// ============================================================================

/**
 * Trace LLM call within agent execution
 */
export async function traceLLMCall<T>(
  parentSpan: Span,
  model: string,
  promptLength: number,
  executor: () => Promise<{ result: T; tokens: { prompt: number; completion: number } }>
): Promise<T> {
  const llmSpan = tracingService.startLLMSpan(model, {
    parentContext: parentSpan.context,
    attributes: {
      'llm.prompt_length': promptLength
    }
  })

  try {
    const { result, tokens } = await executor()

    await tracingService.endLLMSpan(llmSpan, {
      promptTokens: tokens.prompt,
      completionTokens: tokens.completion,
      success: true
    })

    return result
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    
    await tracingService.endLLMSpan(llmSpan, {
      promptTokens: promptLength,
      completionTokens: 0,
      success: false,
      error: err
    })
    
    throw error
  }
}

// ============================================================================
// TASK RESULT TRACING
// ============================================================================

/**
 * Record task result in span
 */
export function traceTaskResult(
  span: AgentSpan,
  result: AgentTaskResult
): void {
  tracingService.setAttributes(span, {
    'task.success': result.success,
    'task.message': result.message || '',
    'task.has_suggestions': Boolean(result.suggestions?.length),
    'task.has_next_steps': Boolean(result.nextSteps?.length)
  })

  if (result.error) {
    tracingService.addEvent(span, 'task.error', {
      'error.message': result.error
    })
  }

  if (result.suggestions?.length) {
    tracingService.addEvent(span, 'task.suggestions', {
      'suggestions.count': result.suggestions.length,
      'suggestions.list': result.suggestions.join(', ')
    })
  }
}

// ============================================================================
// AGENT LIFECYCLE TRACING
// ============================================================================

/**
 * Trace agent state change
 */
export function traceAgentStateChange(
  agentId: string,
  agentName: string,
  previousState: string,
  newState: string,
  reason?: string
): void {
  const span = tracingService.startSpan(`agent.state_change.${agentId}`, {
    kind: 'internal',
    attributes: {
      'agent.id': agentId,
      'agent.name': agentName,
      'state.previous': previousState,
      'state.new': newState,
      'state.reason': reason || 'unknown'
    }
  })

  tracingService.endSpan(span, 'ok')
}

/**
 * Trace agent enabled/disabled
 */
export function traceAgentToggle(
  agentId: string,
  agentName: string,
  enabled: boolean
): void {
  const span = tracingService.startSpan(`agent.toggle.${agentId}`, {
    kind: 'internal',
    attributes: {
      'agent.id': agentId,
      'agent.name': agentName,
      'agent.enabled': enabled
    }
  })

  tracingService.addEvent(span, enabled ? 'agent.enabled' : 'agent.disabled')
  tracingService.endSpan(span, 'ok')
}

// ============================================================================
// QUEUE TRACING
// ============================================================================

/**
 * Trace task added to queue
 */
export function traceTaskQueued(task: AgentTask): void {
  const span = tracingService.startSpan('task.queued', {
    kind: 'producer',
    attributes: {
      'task.id': task.id,
      'task.type': task.type,
      'task.priority': task.priority,
      'task.agent_id': task.agentId
    }
  })

  tracingService.endSpan(span, 'ok')
}

/**
 * Trace task dequeued for processing
 */
export function traceTaskDequeued(task: AgentTask, agentId: string): void {
  const span = tracingService.startSpan('task.dequeued', {
    kind: 'consumer',
    attributes: {
      'task.id': task.id,
      'task.type': task.type,
      'task.agent_id': agentId,
      'task.queue_time_ms': Date.now() - new Date(task.createdAt).getTime()
    }
  })

  tracingService.endSpan(span, 'ok')
}

// ============================================================================
// HUMAN INTERACTION TRACING
// ============================================================================

/**
 * Trace human intervention request
 */
export function traceHumanInterventionRequired(
  task: AgentTask,
  reason: string
): void {
  const span = tracingService.startSpan('human.intervention_required', {
    kind: 'internal',
    attributes: {
      'task.id': task.id,
      'task.type': task.type,
      'intervention.reason': reason
    }
  })

  tracingService.addEvent(span, 'awaiting_human')
  tracingService.endSpan(span, 'ok')
}

/**
 * Trace human intervention completed
 */
export function traceHumanInterventionCompleted(
  taskId: string,
  duration: number,
  approved: boolean
): void {
  const span = tracingService.startSpan('human.intervention_completed', {
    kind: 'internal',
    attributes: {
      'task.id': taskId,
      'intervention.duration_ms': duration,
      'intervention.approved': approved
    }
  })

  tracingService.addEvent(span, approved ? 'human.approved' : 'human.rejected')
  tracingService.endSpan(span, 'ok')
}

// ============================================================================
// METRICS HELPERS
// ============================================================================

/**
 * Get agent execution metrics from traces
 */
export function getAgentMetrics(agentId: string): {
  totalExecutions: number
  successRate: number
  avgDuration: number
  toolUsage: Record<string, number>
  recentErrors: string[]
} {
  const traces = tracingService.getTracesByName(`agent.${agentId}`)
  
  const executions = traces.filter(t => t.endTime)
  const successful = executions.filter(t => t.status === 'ok')
  const failed = executions.filter(t => t.status === 'error')
  
  const durations = executions
    .map(t => (t.endTime || 0) - t.startTime)
    .filter(d => d > 0)
  
  const avgDuration = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0

  // Count tool usage
  const toolUsage: Record<string, number> = {}
  executions.forEach(t => {
    t.events
      .filter(e => e.name === 'tool.used')
      .forEach(e => {
        const tool = e.attributes?.['tool.name'] as string
        if (tool) {
          toolUsage[tool] = (toolUsage[tool] || 0) + 1
        }
      })
  })

  // Get recent errors
  const recentErrors = failed
    .slice(-5)
    .map(t => t.statusMessage || 'Unknown error')

  return {
    totalExecutions: executions.length,
    successRate: executions.length > 0 
      ? (successful.length / executions.length) * 100 
      : 0,
    avgDuration,
    toolUsage,
    recentErrors
  }
}

/**
 * Get LLM metrics from traces
 */
export function getLLMMetrics(): {
  totalCalls: number
  totalTokens: number
  avgResponseTime: number
  errorRate: number
  tokensByModel: Record<string, number>
} {
  const traces = tracingService.getTracesByName('llm.')
  
  const calls = traces.filter(t => t.endTime)
  const successful = calls.filter(t => t.status === 'ok')
  const failed = calls.filter(t => t.status === 'error')
  
  let totalTokens = 0
  const tokensByModel: Record<string, number> = {}
  const responseTimes: number[] = []

  calls.forEach(t => {
    const tokens = (t.attributes['llm.total_tokens'] as number) || 0
    const model = (t.attributes['llm.model'] as string) || 'unknown'
    const responseTime = (t.attributes['llm.response_time_ms'] as number) || 0

    totalTokens += tokens
    tokensByModel[model] = (tokensByModel[model] || 0) + tokens
    
    if (responseTime > 0) {
      responseTimes.push(responseTime)
    }
  })

  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0

  return {
    totalCalls: calls.length,
    totalTokens,
    avgResponseTime,
    errorRate: calls.length > 0 
      ? (failed.length / calls.length) * 100 
      : 0,
    tokensByModel
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  tracingService,
  withTracing,
  type Span,
  type AgentSpan,
  type TraceContext
} from './tracing'
