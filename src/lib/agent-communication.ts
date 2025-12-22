/**
 * Agent Communication System
 *
 * Permite que agentes:
 * - troquem mensagens (request/response/notification/alert)
 * - peçam ajuda uns aos outros
 * - compartilhem contexto estruturado
 */

import type { Agent, AgentTask } from "./agents.js";
import { isValidAgentId, sanitizeString } from "./agents.js";

export type AgentMessageType = "request" | "response" | "notification" | "alert";
export type AgentMessagePriority = "low" | "medium" | "high" | "critical";

export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId?: string; // undefined = broadcast
  type: AgentMessageType;
  priority: AgentMessagePriority;
  content: string;
  data?: Record<string, unknown>;
  timestamp: string;
  relatedTaskId?: string;
}

export interface SharedContext {
  id: string;
  type: string;
  data: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  accessibleBy: string[]; // IDs de agentes que podem acessar este contexto (ou '*')
}

// Configurações
const LOCK_TIMEOUT_MS = 5000;
const MAX_CONTEXTS = 500;
const MAX_CONTEXT_SIZE = 50_000; // 50KB
const MAX_MESSAGES = 1000;
const MAX_MESSAGE_SIZE = 10_000; // total JSON bytes
const MAX_MESSAGE_CONTENT_LEN = 5_000; // characters
const MAX_MESSAGE_DATA_SIZE = 100_000; // bytes

// Default cleanup TTL
const DEFAULT_CLEANUP_HOURS = 24;

// LRU Cache para contexts
class LRUContextCache {
  private cache = new Map<string, SharedContext>();
  private order: string[] = [];
  private maxSize: number;

  private onEvict?: (id: string, context: SharedContext) => void;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  setOnEvict(cb: (id: string, context: SharedContext) => void): void {
    this.onEvict = cb;
  }

  set(key: string, value: SharedContext): void {
    if (this.cache.has(key)) {
      this.order = this.order.filter((k) => k !== key);
    }
    if (this.cache.size >= this.maxSize) {
      const oldest = this.order.shift();
      if (oldest) {
        const ctx = this.cache.get(oldest);
        if (ctx && this.onEvict) {
          try {
            this.onEvict(oldest, ctx);
          } catch (err) {
            console.error("[LRUContextCache] onEvict callback error:", err);
          }
        }
        this.cache.delete(oldest);
      }
    }
    this.cache.set(key, value);
    this.order.push(key);
  }

  get(key: string): SharedContext | undefined {
    const value = this.cache.get(key);
    if (value) {
      this.order = this.order.filter((k) => k !== key);
      this.order.push(key);
    }
    return value;
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.order = this.order.filter((k) => k !== key);
  }

  clear(): void {
    this.cache.clear();
    this.order = [];
  }

  size(): number {
    return this.cache.size;
  }

  values(): SharedContext[] {
    return Array.from(this.cache.values());
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

class AgentCommunicationHub {
  private messages: AgentMessage[] = [];
  private readonly contexts = new LRUContextCache(MAX_CONTEXTS);
  // Mapping (type:createdBy) -> contextId for O(1) lookup
  private readonly contextsByKey = new Map<string, string>();
  // AccessibleBy set for quick lookup by id
  private readonly accessibleBySets: Map<string, Set<string>> = new Map();
  private readonly contextsByAgent = new Map<string, Set<string>>();
  private readonly contextsByType = new Map<string, Set<string>>();

  constructor() {
    // Setup eviction callback to keep indices consistent
    this.contexts.setOnEvict((id: string, context: SharedContext) => {
      try {
        this.removeContextIndices(context);
        this.accessibleBySets.delete(id);
        const key = `${context.type}:${context.createdBy}`;
        if (this.contextsByKey.get(key) === id) {
          this.contextsByKey.delete(key);
        }
      } catch (err) {
        console.error("[AgentCommunicationHub] Eviction cleanup error:", err);
      }
    });
  }

  private updateContextIndices(context: SharedContext): void {
    // Index by accessibleBy
    (context.accessibleBy || []).forEach((agentId) => {
      if (!this.contextsByAgent.has(agentId)) {
        this.contextsByAgent.set(agentId, new Set());
      }
      this.contextsByAgent.get(agentId)!.add(context.id);
    });

    // Index by type
    if (!this.contextsByType.has(context.type)) {
      this.contextsByType.set(context.type, new Set());
    }
    this.contextsByType.get(context.type)!.add(context.id);
  }

  private removeContextIndices(context: SharedContext): void {
    (context.accessibleBy || []).forEach((agentId) => {
      this.contextsByAgent.get(agentId)?.delete(context.id);
      if (this.contextsByAgent.get(agentId)?.size === 0) {
        this.contextsByAgent.delete(agentId);
      }
    });

    const setForType = this.contextsByType.get(context.type);
    setForType?.delete(context.id);
    if (setForType && setForType.size === 0) {
      this.contextsByType.delete(context.type);
    }
  }
  private readonly subscribers: Map<string, Set<(message: AgentMessage) => void>> = new Map();

  // Lock para race conditions
  private messageLock = false;
  private lockQueue: Array<{
    resolve: () => void;
    reject: (err: Error) => void;
    timer: NodeJS.Timeout;
  }> = [];
  // Context lock
  private contextLock = false;
  private contextLockQueue: Array<{
    resolve: () => void;
    reject: (err: Error) => void;
    timer: NodeJS.Timeout;
  }> = [];

  private async acquireLock(): Promise<void> {
    if (!this.messageLock) {
      this.messageLock = true;
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.lockQueue.findIndex((it) => it.resolve === resolve);
        if (idx > -1) this.lockQueue.splice(idx, 1);
        reject(new Error("Lock acquisition timeout"));
      }, LOCK_TIMEOUT_MS);

      this.lockQueue.push({ resolve, reject, timer });
    });
  }

  private releaseLock(): void {
    const next = this.lockQueue.shift();
    if (next) {
      clearTimeout(next.timer);
      // Grant lock to next waiter before resolving
      this.messageLock = true;
      next.resolve();
    } else {
      this.messageLock = false;
    }
  }

  private async acquireContextLock(): Promise<void> {
    if (!this.contextLock) {
      this.contextLock = true;
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.contextLockQueue.findIndex((it) => it.resolve === resolve);
        if (idx > -1) this.contextLockQueue.splice(idx, 1);
        reject(new Error("Context lock acquisition timeout"));
      }, LOCK_TIMEOUT_MS);

      this.contextLockQueue.push({ resolve, reject, timer });
    });
  }

  private releaseContextLock(): void {
    const next = this.contextLockQueue.shift();
    if (next) {
      clearTimeout(next.timer);
      // Grant lock to next waiter before resolving
      this.contextLock = true;
      next.resolve();
    } else {
      this.contextLock = false;
    }
  }

  private sanitizeMessageContent(content: string): string {
    const s = sanitizeString(content);
    return s.length > MAX_MESSAGE_CONTENT_LEN ? s.slice(0, MAX_MESSAGE_CONTENT_LEN) : s;
  }

  private sanitizeMessageData(data: unknown, depth = 0): unknown {
    const MAX_DEPTH = 3;
    if (depth > MAX_DEPTH) return null;
    if (typeof data === "string") return sanitizeString(data);
    if (typeof data === "function") return null;
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeMessageData(item, depth + 1));
    }
    if (data && typeof data === "object") {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeMessageData(value, depth + 1);
      }
      return sanitized;
    }
    return data;
  }

  private sanitizeAgentMessage(
    message: Omit<AgentMessage, "id" | "timestamp">
  ): Omit<AgentMessage, "id" | "timestamp"> {
    return {
      ...message,
      content: this.sanitizeMessageContent(message.content),
      data: message.data
        ? (this.sanitizeMessageData(message.data) as Record<string, unknown>)
        : undefined,
    };
  }

  private validateAgentId(agentId: string): boolean {
    return isValidAgentId(agentId);
  }

  // Deep merge helper used by setContext
  private deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>
  ): Record<string, unknown> {
    const result: Record<string, unknown> = { ...target };
    for (const [key, value] of Object.entries(source)) {
      const current = result[key];
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        current &&
        typeof current === "object" &&
        !Array.isArray(current)
      ) {
        result[key] = this.deepMerge(
          current as Record<string, unknown>,
          value as Record<string, unknown>
        );
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  /**
   * Envia uma mensagem de um agente para outro (ou broadcast)
   */
  async sendMessage(message: Omit<AgentMessage, "id" | "timestamp">): Promise<AgentMessage> {
    // Validar agent IDs
    if (!this.validateAgentId(message.fromAgentId)) {
      console.error(`[AgentCommunicationHub] Invalid sender agent ID: ${message.fromAgentId}`);
      throw new Error(`Invalid sender agent ID: ${message.fromAgentId}`);
    }
    if (message.toAgentId && !this.validateAgentId(message.toAgentId)) {
      console.error(`[AgentCommunicationHub] Invalid recipient agent ID: ${message.toAgentId}`);
      throw new Error(`Invalid recipient agent ID: ${message.toAgentId}`);
    }

    // Validar tamanho da mensagem (DoS prevention)
    if (message.content.length > MAX_MESSAGE_CONTENT_LEN) {
      console.error(
        `[AgentCommunicationHub] Message content too large: ${message.content.length} bytes`
      );
      throw new Error(`Message content exceeds limit of ${MAX_MESSAGE_CONTENT_LEN} characters`);
    }

    if (message.data) {
      const dataSize = JSON.stringify(message.data).length;
      if (dataSize > MAX_MESSAGE_DATA_SIZE) {
        console.error(`[AgentCommunicationHub] Message data too large: ${dataSize} bytes`);
        throw new Error(`Message data exceeds limit of ${MAX_MESSAGE_DATA_SIZE} bytes`);
      }
    }

    // Sanitizar mensagem
    const sanitized = this.sanitizeAgentMessage(message);

    const fullMessage: AgentMessage = {
      ...sanitized,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    // Validar tamanho do objeto completo (JSON)
    const fullSize = JSON.stringify(fullMessage).length;
    if (fullSize > MAX_MESSAGE_SIZE) {
      console.error(`[AgentCommunicationHub] Full message size too large: ${fullSize} bytes`);
      throw new Error(`Full message size exceeds limit of ${MAX_MESSAGE_SIZE} bytes`);
    }

    // Adquirir lock
    try {
      await this.acquireLock();

      // Verificar limite ANTES de adicionar (evita race condition)
      if (this.messages.length >= MAX_MESSAGES) {
        this.messages.shift(); // Remove oldest message (O(1) amortizado)
      }

      this.messages.push(fullMessage);
    } catch (error) {
      console.error("[AgentCommunicationHub] Failed to send message:", error);
      throw error;
    } finally {
      this.releaseLock();
    }

    // Notifica inscritos (fora do lock para não bloquear)
    this.notifySubscribers(fullMessage);

    return fullMessage;
  }

  private notifySubscribers(fullMessage: AgentMessage): void {
    if (fullMessage.toAgentId) {
      const subscribers = this.subscribers.get(fullMessage.toAgentId);
      subscribers?.forEach((callback) => {
        // Usar queueMicrotask para execução assíncrona isolada
        queueMicrotask(() => {
          try {
            callback(fullMessage);
          } catch (error) {
            console.error(
              `[AgentCommunicationHub] Subscriber callback error (target=${fullMessage.toAgentId}):`,
              error
            );
          }
        });
      });
    } else {
      // Broadcast para todos
      this.subscribers.forEach((subscribers) => {
        subscribers.forEach((callback) => {
          // Usar queueMicrotask para execução assíncrona isolada
          queueMicrotask(() => {
            try {
              callback(fullMessage);
            } catch (error) {
              console.error(
                "[AgentCommunicationHub] Subscriber callback error (broadcast):",
                error
              );
            }
          });
        });
      });
    }
  }

  /**
   * Inscreve um agente para receber mensagens destinadas a ele
   * Retorna função de unsubscribe
   */
  subscribe(agentId: string, callback: (message: AgentMessage) => void): () => void {
    // Validar agentId
    if (!this.validateAgentId(agentId)) {
      throw new Error(`Invalid agent id for subscribe: ${agentId}`);
    }

    if (!this.subscribers.has(agentId)) {
      this.subscribers.set(agentId, new Set());
    }

    this.subscribers.get(agentId)!.add(callback);

    // Função de cleanup
    return () => {
      const subscribers = this.subscribers.get(agentId);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(agentId);
        }
      }
    };
  }

  /**
   * Retorna mensagens recentes relevantes para um agente:
   * - mensagens diretamente endereçadas a ele
   * - mensagens de broadcast
   */
  getMessages(agentId: string, limit: number = 50): AgentMessage[] {
    const results: AgentMessage[] = [];
    for (let i = this.messages.length - 1; i >= 0 && results.length < limit; i--) {
      const m = this.messages[i];
      if (m.toAgentId === agentId || !m.toAgentId) {
        results.push(m);
      }
    }
    return results.reverse();
  }

  /**
   * Cria ou atualiza um contexto compartilhado
   * - mesma combinação (type + createdBy) é considerada "o mesmo contexto"
   */
  async setContext(
    context: Omit<SharedContext, "id" | "createdAt" | "updatedAt">
  ): Promise<SharedContext> {
    // Validar agent ID
    if (!this.validateAgentId(context.createdBy)) {
      console.error(`[AgentCommunicationHub] Invalid agent ID in context: ${context.createdBy}`);
      throw new Error(`Invalid agent ID in context: ${context.createdBy}`);
    }

    const contextKey = `${context.type}:${context.createdBy}`;
    const existingId = this.contextsByKey.get(contextKey);
    let existingContext: SharedContext | undefined;
    if (existingId) existingContext = this.contexts.get(existingId);

    try {
      await this.acquireContextLock();

      // Sanitize and validate context data size
      const sanitizedData = this.sanitizeMessageData(context.data) as Record<string, unknown>;
      const dataSize = JSON.stringify(sanitizedData).length;
      if (dataSize > MAX_CONTEXT_SIZE) {
        console.error(`[AgentCommunicationHub] Context data too large: ${dataSize} bytes`);
        throw new Error(`Context data exceeds limit of ${MAX_CONTEXT_SIZE} bytes`);
      }

      if (existingContext) {
        const mergedData = this.deepMerge(
          existingContext.data as Record<string, unknown>,
          sanitizedData
        );
        const updated: SharedContext = {
          ...existingContext,
          data: mergedData,
          accessibleBy: context.accessibleBy ?? existingContext.accessibleBy,
          updatedAt: new Date().toISOString(),
        };

        // Atualizar LRU cache
        this.contexts.set(updated.id, updated);

        // Atualizar índices: remove antigos e adiciona novos
        this.removeContextIndices(existingContext);
        this.updateContextIndices(updated);

        // Update key map and accessible sets
        this.contextsByKey.set(contextKey, updated.id);
        this.accessibleBySets.set(updated.id, new Set(updated.accessibleBy));

        return updated;
      } else {
        const now = new Date().toISOString();
        const newContext: SharedContext = {
          ...context,
          data: sanitizedData,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };

        // Adicionar ao LRU cache
        this.contexts.set(newContext.id, newContext);

        // Atualizar índices
        this.updateContextIndices(newContext);

        // store key and accessibleBySet
        this.contextsByKey.set(contextKey, newContext.id);
        this.accessibleBySets.set(newContext.id, new Set(newContext.accessibleBy));

        return newContext;
      }
    } finally {
      this.releaseContextLock();
    }
  }

  /**
   * Retorna contextos compartilhados acessíveis por um agente
   * - acessível se `accessibleBy` contém o agentId ou '*'
   * - opcionalmente filtra por tipo
   * Otimizado para O(n) com early exit
   */
  getContext(agentId: string, type?: string): SharedContext[] {
    const results: SharedContext[] = [];

    // Usar índice se type especificado (early exit)
    if (type) {
      const keys = this.contextsByType.get(type);
      if (!keys || keys.size === 0) return []; // Early exit

      // Converter Set para Array para compatibilidade com target ES2015
      Array.from(keys).forEach((key) => {
        const context = this.contexts.get(key);
        if (!context) return;

        // Check acessibilidade (early exit em cada iteração)
        const accessibleSet = this.accessibleBySets.get(context.id);
        if (accessibleSet && (accessibleSet.has(agentId) || accessibleSet.has("*"))) {
          results.push(context);
        }
      });
    } else {
      // Sem filtro de tipo, usar índices para performance
      const agentKeys = this.contextsByAgent.get(agentId) || new Set();
      const wildcardKeys = this.contextsByAgent.get("*") || new Set();

      const allKeys = new Set<string>([...agentKeys, ...wildcardKeys]);
      allKeys.forEach((key) => {
        const context = this.contexts.get(key);
        if (context) results.push(context);
      });
    }

    return results;
  }

  /**
   * Cria uma mensagem de "pedido de ajuda" entre agentes
   */
  async requestHelp(
    fromAgent: Agent,
    toAgentId: string,
    task: AgentTask,
    reason: string
  ): Promise<AgentMessage> {
    return await this.sendMessage({
      fromAgentId: fromAgent.id,
      toAgentId,
      type: "request",
      priority: task.priority as AgentMessagePriority,
      content: `Help requested: ${reason}`,
      data: {
        task,
        reason,
        requestType: "help",
      },
      relatedTaskId: task.id,
    });
  }

  /**
   * Broadcast de alerta para todos os agentes
   */
  async broadcastAlert(
    fromAgentId: string,
    message: string,
    data?: Record<string, unknown>
  ): Promise<AgentMessage> {
    return await this.sendMessage({
      fromAgentId,
      type: "alert",
      priority: "high",
      content: message,
      data,
    });
  }

  /**
   * Limpa mensagens e contextos antigos
   * Otimizado para não modificar array durante iteração
   */
  async cleanup(olderThanHours: number = DEFAULT_CLEANUP_HOURS): Promise<void> {
    const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000;

    // Mensagens - lockar para evitar race
    await this.acquireLock();
    try {
      let writeIdx = 0;
      for (let readIdx = 0; readIdx < this.messages.length; readIdx++) {
        if (new Date(this.messages[readIdx].timestamp).getTime() > cutoffTime) {
          this.messages[writeIdx++] = this.messages[readIdx];
        }
      }
      this.messages.length = writeIdx;
    } finally {
      this.releaseLock();
    }

    // Contextos - lockar para evitar race
    await this.acquireContextLock();
    try {
      const keysToDelete: string[] = [];
      this.contexts.keys().forEach((id) => {
        const context = this.contexts.get(id);
        if (context && new Date(context.updatedAt).getTime() < cutoffTime) {
          keysToDelete.push(id);
        }
      });

      keysToDelete.forEach((id) => {
        const context = this.contexts.get(id);
        if (context) {
          // Remove índices através do helper
          this.removeContextIndices(context);
        }
        // Remove accessibleBySets and contextsByKey as well
        this.accessibleBySets.delete(id);
        // find and remove key mapping
        const keyToDelete = `${context?.type}:${context?.createdBy}`;
        if (this.contextsByKey.get(keyToDelete) === id) {
          this.contextsByKey.delete(keyToDelete);
        }
        this.contexts.delete(id);
      });
    } finally {
      this.releaseContextLock();
    }
  }

  /**
   * Estatísticas simples de comunicação
   */
  getStats(): {
    totalMessages: number;
    messagesByType: Record<AgentMessageType, number>;
    activeContexts: number;
    subscribedAgents: number;
  } {
    const messagesByType = {
      request: 0,
      response: 0,
      notification: 0,
      alert: 0,
    } satisfies Record<AgentMessageType, number>;

    this.messages.forEach((m) => {
      messagesByType[m.type] = (messagesByType[m.type] || 0) + 1;
    });

    return {
      totalMessages: this.messages.length,
      messagesByType,
      activeContexts: this.contexts.size(),
      subscribedAgents: this.subscribers.size,
    };
  }
}

/**
 * Instância global do hub de comunicação entre agentes
 */
export const communicationHub = new AgentCommunicationHub();

/**
 * Helper: notificar agentes (broadcast) com uma mensagem simples
 */
export async function notifyAgents(
  fromAgentId: string,
  message: string,
  data?: Record<string, unknown>
): Promise<AgentMessage> {
  return await communicationHub.sendMessage({
    fromAgentId,
    type: "notification",
    priority: "medium",
    content: message,
    data,
  });
}

/**
 * Helper: compartilhar contexto entre agentes
 */
export async function shareContext(
  agentId: string,
  type: string,
  data: Record<string, unknown>,
  accessibleBy: string[] = ["*"]
): Promise<SharedContext> {
  return await communicationHub.setContext({
    type,
    data,
    createdBy: agentId,
    accessibleBy,
  });
}
