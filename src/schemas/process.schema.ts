/**
 * Schemas Zod para validação de Processos
 * Garante integridade dos dados críticos do sistema
 */

import { z } from "zod";

// ============================================
// SCHEMAS DE PROCESSO
// ============================================

// Schema para número CNJ (formato oficial)
export const numeroCNJSchema = z.string().regex(
  /^\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4}$/,
  "Número CNJ inválido. Formato esperado: 0000000-00.0000.0.00.0000"
);

// Schema para prazo processual
export const prazoSchema = z.object({
  id: z.string().uuid(),
  descricao: z.string().min(3, "Descrição deve ter no mínimo 3 caracteres"),
  dataInicio: z.string().datetime(),
  dataFinal: z.string().datetime(),
  tipo: z.enum(["CPC", "CLT"]),
  urgente: z.boolean().default(false),
  concluido: z.boolean().default(false),
});

// Schema para processo completo
export const processSchema = z.object({
  id: z.string().uuid(),
  numeroCNJ: numeroCNJSchema,
  titulo: z.string().min(5, "Título deve ter no mínimo 5 caracteres").max(200, "Título muito longo"),
  autor: z.string().min(3, "Nome do autor inválido"),
  reu: z.string().min(3, "Nome do réu inválido"),
  status: z.enum(["ativo", "suspenso", "concluido", "arquivado"]),
  valorCausa: z.number().min(0, "Valor da causa deve ser positivo").optional(),
  comarca: z.string().min(3, "Comarca inválida").optional(),
  vara: z.string().min(3, "Vara inválida").optional(),
  prazos: z.array(prazoSchema).default([]),
  observacoes: z.string().max(5000, "Observações muito longas").optional(),
  criadoEm: z.string().datetime(),
  atualizadoEm: z.string().datetime(),
});

// ============================================
// SCHEMAS DE CLIENTE
// ============================================

// Schema para CPF (validação básica de formato)
export const cpfSchema = z.string().regex(
  /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  "CPF inválido. Formato esperado: 000.000.000-00"
);

// Schema para CNPJ (validação básica de formato)
export const cnpjSchema = z.string().regex(
  /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  "CNPJ inválido. Formato esperado: 00.000.000/0000-00"
);

// Schema para telefone (aceita vários formatos)
export const telefoneSchema = z.string().regex(
  /^\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$/,
  "Telefone inválido. Formato esperado: (11) 91234-5678 ou 11912345678"
);

// Schema para email
export const emailSchema = z.string().email("Email inválido");

// Schema para cliente
export const clienteSchema = z.object({
  id: z.string().uuid(),
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(200, "Nome muito longo"),
  cpfCnpj: z.union([cpfSchema, cnpjSchema]),
  email: emailSchema.optional(),
  telefone: telefoneSchema.optional(),
  endereco: z.string().max(500, "Endereço muito longo").optional(),
  observacoes: z.string().max(2000, "Observações muito longas").optional(),
  criadoEm: z.string().datetime(),
  atualizadoEm: z.string().datetime(),
});

// ============================================
// SCHEMAS DE MINUTA
// ============================================

export const minutaSchema = z.object({
  id: z.string().uuid(),
  titulo: z.string().min(5, "Título deve ter no mínimo 5 caracteres").max(200, "Título muito longo"),
  processId: z.string().uuid().optional(),
  tipo: z.enum(["peticao", "contrato", "parecer", "recurso", "procuracao", "outro"]),
  conteudo: z.string().min(10, "Conteúdo muito curto"),
  status: z.enum(["rascunho", "em-revisao", "pendente-revisao", "finalizada", "arquivada"]),
  criadoEm: z.string().datetime(),
  atualizadoEm: z.string().datetime(),
  autor: z.string().min(3, "Nome do autor inválido"),
  googleDocsId: z.string().optional(),
  googleDocsUrl: z.string().url("URL do Google Docs inválida").optional(),
  criadoPorAgente: z.boolean().default(false),
  agenteId: z.string().optional(),
  templateId: z.string().optional(),
  expedienteId: z.string().uuid().optional(),
  variaveis: z.record(z.string()).optional(),
});

// ============================================
// SCHEMAS DE FINANCEIRO
// ============================================

export const financialEntrySchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["income", "expense"]),
  amount: z.number().positive("Valor deve ser positivo"),
  category: z.string().min(3, "Categoria inválida"),
  description: z.string().max(500, "Descrição muito longa").optional(),
  date: z.string().datetime(),
  processId: z.string().uuid().optional(),
  criadoEm: z.string().datetime(),
  atualizadoEm: z.string().datetime(),
});

// ============================================
// SCHEMAS DE AGENTES IA
// ============================================

export const agentTaskSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().min(3, "ID do agente inválido"),
  type: z.string().min(3, "Tipo de tarefa inválido"),
  priority: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["pending", "in_progress", "completed", "failed"]),
  description: z.string().min(5, "Descrição muito curta").max(1000, "Descrição muito longa"),
  data: z.record(z.any()).optional(),
  result: z.record(z.any()).optional(),
  error: z.string().optional(),
  createdAt: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
});

// ============================================
// TIPOS EXPORTADOS (inferência do Zod)
// ============================================

export type ProcessValidated = z.infer<typeof processSchema>;
export type PrazoValidated = z.infer<typeof prazoSchema>;
export type ClienteValidated = z.infer<typeof clienteSchema>;
export type MinutaValidated = z.infer<typeof minutaSchema>;
export type FinancialEntryValidated = z.infer<typeof financialEntrySchema>;
export type AgentTaskValidated = z.infer<typeof agentTaskSchema>;

// ============================================
// HELPERS DE VALIDAÇÃO
// ============================================

// Helper para validar processo e retornar erros formatados
export function validateProcess(data: unknown) {
  const result = processSchema.safeParse(data);
  if (!result.success) {
    return {
      isValid: false as const,
      errors: result.error.format(),
    };
  }
  return {
    isValid: true as const,
    data: result.data,
  };
}

// Helper para validar cliente
export function validateCliente(data: unknown) {
  const result = clienteSchema.safeParse(data);
  if (!result.success) {
    return {
      isValid: false as const,
      errors: result.error.format(),
    };
  }
  return {
    isValid: true as const,
    data: result.data,
  };
}

// Helper para validar minuta
export function validateMinuta(data: unknown) {
  const result = minutaSchema.safeParse(data);
  if (!result.success) {
    return {
      isValid: false as const,
      errors: result.error.format(),
    };
  }
  return {
    isValid: true as const,
    data: result.data,
  };
}

// Helper para validar entrada financeira
export function validateFinancialEntry(data: unknown) {
  const result = financialEntrySchema.safeParse(data);
  if (!result.success) {
    return {
      isValid: false as const,
      errors: result.error.format(),
    };
  }
  return {
    isValid: true as const,
    data: result.data,
  };
}

// Helper para validar tarefa de agente
export function validateAgentTask(data: unknown) {
  const result = agentTaskSchema.safeParse(data);
  if (!result.success) {
    return {
      isValid: false as const,
      errors: result.error.format(),
    };
  }
  return {
    isValid: true as const,
    data: result.data,
  };
}

// ============================================
// VALIDADORES ESPECÍFICOS
// ============================================

// Validar se CPF tem dígitos verificadores corretos (algoritmo oficial)
export function isValidCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, "");
  if (cleanCPF.length !== 11 || /^(\d)\1+$/.test(cleanCPF)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
}

// Validar se CNPJ tem dígitos verificadores corretos (algoritmo oficial)
export function isValidCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, "");
  if (cleanCNPJ.length !== 14 || /^(\d)\1+$/.test(cleanCNPJ)) return false;

  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cleanCNPJ.charAt(12))) return false;

  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cleanCNPJ.charAt(13))) return false;

  return true;
}
