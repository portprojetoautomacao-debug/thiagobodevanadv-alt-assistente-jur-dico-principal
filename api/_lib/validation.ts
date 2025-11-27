/**
 * Validações Zod para entrada de dados
 * Centraliza todas as validações de API
 */

import { z } from 'zod';

// --- Tipos de Agente ---

export const AgentTaskTypeSchema = z.enum([
  'CALCULATE_DEADLINE',
  'DRAFT_PETITION',
  'RESEARCH_PRECEDENTS',
  'CLIENT_COMMUNICATION',
  'CHECK_DATAJUD',
  'RISK_ANALYSIS',
  'BILLING_ANALYSIS',
  'ORGANIZE_FILES',
  'COMPLIANCE_CHECK',
  'LEGAL_TRANSLATION',
  'CONTRACT_REVIEW',
  'CASE_STRATEGY'
]);

export const TaskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export const TaskStatusSchema = z.enum(['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED']);

export const AgentTaskSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().min(1),
  type: AgentTaskTypeSchema,
  priority: TaskPrioritySchema,
  status: TaskStatusSchema,
  createdAt: z.string().datetime(),
  data: z.record(z.string(), z.unknown()),
  error: z.string().optional(),
  completedAt: z.string().datetime().optional(),
  processingTimeMs: z.number().optional()
});

export const AgentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  capabilities: z.array(z.string()),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']),
  lastActive: z.string().datetime().optional()
});

// --- Validações de API ---

const ProcessQueueRequestSchema = z.object({
  maxTasks: z.number().min(1).max(50).optional().default(10),
  priority: TaskPrioritySchema.optional(),
  agentId: z.string().optional()
});

const ProcessTaskRequestSchema = z.object({
  task: AgentTaskSchema,
  agent: AgentSchema
});

// --- Utilitários ---

export function handleValidationError(error: z.ZodError) {
  const issues = error.issues.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message
  }));

  return {
    ok: false,
    error: 'Validation failed',
    issues,
    timestamp: new Date().toISOString()
  };
}

export function validateProcessQueueRequest(data: unknown) {
  try {
    const result = ProcessQueueRequestSchema.parse(data);
    return { success: true, ...result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: handleValidationError(error) };
    }
    return { success: false, error: { ok: false, error: 'Unknown validation error' } };
  }
}

export function validateProcessTaskRequest(data: unknown) {
  try {
    const result = ProcessTaskRequestSchema.parse(data);
    return { success: true, task: result.task, agent: result.agent };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: handleValidationError(error) };
    }
    return { success: false, error: { ok: false, error: 'Unknown validation error' } };
  }
}