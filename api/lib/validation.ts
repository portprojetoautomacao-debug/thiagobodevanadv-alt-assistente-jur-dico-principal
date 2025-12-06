/**
 * Validações Zod para entrada de dados
 * Centraliza todas as validações de API
 */

import { z } from "zod";

// --- Tipos de Agente ---

export const AgentTaskTypeSchema = z.enum([
  "CALCULATE_DEADLINE",
  "DRAFT_PETITION",
  "RESEARCH_PRECEDENTS",
  "CLIENT_COMMUNICATION",
  "CHECK_DATAJUD",
  "RISK_ANALYSIS",
  "BILLING_ANALYSIS",
  "ORGANIZE_FILES",
  "COMPLIANCE_CHECK",
  "LEGAL_TRANSLATION",
  "CONTRACT_REVIEW",
  "CASE_STRATEGY",
]);

export const TaskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const TaskStatusSchema = z.enum([
  "QUEUED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);

export const AgentTaskSchema = z.object({
  id: z
    .string()
    .refine(
      (val) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          val
        ),
      "Invalid UUID"
    ),
  agentId: z.string().min(1),
  type: AgentTaskTypeSchema,
  priority: TaskPrioritySchema,
  status: TaskStatusSchema,
  createdAt: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid datetime"),
  data: z.record(z.string(), z.unknown()),
  error: z.string().optional(),
  completedAt: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid datetime")
    .optional(),
  processingTimeMs: z.number().optional(),
});

export const AgentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  capabilities: z.array(z.string()),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]),
  lastActive: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid datetime")
    .optional(),
});

// --- Validações de API ---

const ProcessQueueRequestSchema = z.object({
  maxTasks: z.number().min(1).max(50).optional().default(10),
  priority: TaskPrioritySchema.optional(),
  agentId: z.string().optional(),
});

const ProcessTaskRequestSchema = z.object({
  task: AgentTaskSchema,
  agent: AgentSchema,
});

// --- Utilitários ---

export function handleValidationError(error: z.ZodError) {
  const issues = error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));

  return {
    ok: false,
    error: "Validation failed",
    issues,
    timestamp: new Date().toISOString(),
  };
}

export function validateProcessQueueRequest(data: unknown) {
  try {
    const parsed = ProcessQueueRequestSchema.parse(data);
    return { success: true, ...parsed };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: handleValidationError(err) };
    }
    return {
      success: false,
      error: { ok: false, error: "Unknown validation error" },
    };
  }
}

export function validateProcessTaskRequest(data: unknown) {
  try {
    const parsed = ProcessTaskRequestSchema.parse(data);
    return { success: true, task: parsed.task, agent: parsed.agent };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: handleValidationError(err) };
    }
    return {
      success: false,
      error: { ok: false, error: "Unknown validation error" },
    };
  }
}
