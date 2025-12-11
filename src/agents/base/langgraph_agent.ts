/**
 * LangGraph Agent Base Class
 *
 * This module provides the base implementation for LangGraph-based agents.
 * It includes retry logic, timeout handling, and safe state management.
 *
 * Security Notes:
 * - Implements timeout protection to prevent hanging operations
 * - Automatic retry with exponential backoff
 * - No dynamic code execution (eval, Function constructor, etc.)
 * - All state mutations are immutable and type-safe
 *
 * Observability:
 * - Sentry AI Monitoring v2 integration
 * - OpenTelemetry semantic conventions
 * - Conversation tracking (sessionId, turn)
 */

import { createChatSpan } from "@/lib/sentry-gemini-integration-v2";
import type { AgentState } from "./agent_state";
import { addMessage, updateState } from "./agent_state";

export interface LangGraphConfig {
  timeoutMs: number;
  maxRetries: number;
  retryDelayMs: number;
  // Observability
  enableSentryTracing?: boolean;
  agentName?: string;
}

export const DEFAULT_CONFIG: LangGraphConfig = {
  timeoutMs: 30000, // 30 seconds
  maxRetries: 3,
  retryDelayMs: 1000,
  enableSentryTracing: true,
  agentName: "unknown-agent",
};

export abstract class LangGraphAgent {
  protected config: LangGraphConfig;
  protected abortController: AbortController | null = null;
  protected sessionId: string;
  protected turnCounter: number = 0;

  constructor(config: Partial<LangGraphConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = `${this.config.agentName}-${Date.now()}`;
  }

  /**
   * Execute the agent with timeout and retry logic
   * Now with Sentry AI Monitoring instrumentation
   */
  async execute(state: AgentState): Promise<AgentState> {
    // Return early if tracing is disabled
    if (!this.config.enableSentryTracing) {
      return await this.executeInternal(state);
    }

    return await this.executeWithTracing(state);
  }

  /**
   * Execute with Sentry AI Monitoring tracing
   */
  private async executeWithTracing(state: AgentState): Promise<AgentState> {
    const messages = this.prepareMessages(state);

    try {
      const result = await createChatSpan<AgentState>(
        this.buildSpanConfig(),
        messages,
        async (span) => {
          this.addConversationTracking(span);
          const executedState = await this.executeInternal(state);
          this.addResponseTracking(span, executedState);
          this.addTokenTracking(span, executedState);

          this.turnCounter++;
          return executedState;
        }
      );

      return result;
    } catch (error) {
      return this.handleExecutionError(state, error);
    }
  }

  /**
   * Prepare messages for Sentry span
   */
  private prepareMessages(state: AgentState) {
    return state.messages.map((m) => ({
      role: m.role as "system" | "user" | "assistant",
      content: String(m.content),
    }));
  }

  /**
   * Build Sentry span configuration
   */
  private buildSpanConfig() {
    return {
      agentName: this.config.agentName || "unknown-agent",
      system: "gemini" as const,
      model: "gemini-2.5-pro",
      temperature: 0.7,
      maxTokens: 2000,
    };
  }

  /**
   * Add conversation tracking attributes to span
   */
  private addConversationTracking(span: any) {
    span?.setAttribute("conversation.session_id", this.sessionId);
    span?.setAttribute("conversation.turn", this.turnCounter);
    span?.setAttribute("gen_ai.agent.name", this.config.agentName || "unknown");
  }

  /**
   * Add response tracking to span
   */
  private addResponseTracking(span: any, executedState: AgentState) {
    if (!this.hasMessages(executedState)) {
      return;
    }

    const lastMessage = this.getLastMessage(executedState);
    span?.setAttribute(
      "gen_ai.response.text",
      JSON.stringify([{ role: lastMessage.role, content: lastMessage.content }])
    );
  }

  /**
   * Add token usage tracking to span
   */
  private addTokenTracking(span: any, executedState: AgentState) {
    const tokensUsed = executedState.data?.tokensUsed;
    if (tokensUsed) {
      span?.setAttribute("gen_ai.usage.total_tokens", tokensUsed);
    }
  }

  /**
   * Check if state has messages
   */
  private hasMessages(state: AgentState): boolean {
    return Boolean(state.messages && state.messages.length > 0);
  }

  /**
   * Get last message from state
   */
  private getLastMessage(state: AgentState) {
    return state.messages[state.messages.length - 1];
  }

  /**
   * Handle execution error
   */
  private handleExecutionError(state: AgentState, error: unknown): AgentState {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[${this.config.agentName}] Execution error:`, error);

    return updateState(state, {
      error: errorMessage,
      completed: true,
    });
  }

  /**
   * Internal execution logic (without tracing wrapper)
   */
  private async executeInternal(state: AgentState): Promise<AgentState> {
    let currentState = state;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      const result = await this.attemptExecution(currentState, attempt);

      if (result.success) {
        return result.state;
      }

      // Continue to next attempt if not the last one
      if (this.isLastAttempt(attempt)) {
        return result.state;
      }

      currentState = result.state;
      await this.applyBackoffDelay(attempt);
    }

    return currentState;
  }

  /**
   * Attempt single execution with timeout
   */
  private async attemptExecution(
    state: AgentState,
    attempt: number
  ): Promise<{ success: boolean; state: AgentState }> {
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      if (process.env.DEBUG_TESTS === "true") {
        console.debug(`[${this.config.agentName}] Attempt ${attempt} starting`);
      }
      this.abortController = new AbortController();
      timeoutId = this.setupTimeout();

      const resultState = await this.run(state, this.abortController.signal);

      if (process.env.DEBUG_TESTS === "true") {
        console.debug(`[${this.config.agentName}] Attempt ${attempt} succeeded`);
      }
      return { success: true, state: resultState };
    } catch (error) {
      const errorState = this.handleAttemptError(state, error, attempt);
      return { success: false, state: errorState };
    } finally {
      this.clearTimeout(timeoutId);
    }
  }

  /**
   * Setup execution timeout
   */
  private setupTimeout(): NodeJS.Timeout {
    return setTimeout(() => {
      this.abortController?.abort();
    }, this.config.timeoutMs);
  }

  /**
   * Clear timeout if exists
   */
  private clearTimeout(timeoutId: NodeJS.Timeout | null) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Check if current attempt is the last one
   */
  private isLastAttempt(attempt: number): boolean {
    return attempt === this.config.maxRetries;
  }

  /**
   * Handle error during execution attempt
   */
  private handleAttemptError(state: AgentState, error: unknown, attempt: number): AgentState {
    if (process.env.DEBUG_TESTS === "true") {
      console.debug(`[${this.config.agentName}] Attempt ${attempt} failed:`, error);
    }
    if (this.isLastAttempt(attempt)) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return updateState(state, {
        error: errorMessage,
        completed: true,
      });
    }

    return updateState(state, {
      retryCount: attempt + 1,
    });
  }

  /**
   * Apply exponential backoff delay
   */
  private async applyBackoffDelay(attempt: number): Promise<void> {
    const delay = this.config.retryDelayMs * Math.pow(2, attempt);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Abstract method to be implemented by concrete agents
   */
  protected abstract run(state: AgentState, signal: AbortSignal): Promise<AgentState>;

  /**
   * Safely abort the current execution
   */
  abort(): void {
    this.abortController?.abort();
  }

  /**
   * Helper to add a message to state
   */
  protected addAgentMessage(
    state: AgentState,
    content: string,
    role: "assistant" | "tool" = "assistant"
  ): AgentState {
    return addMessage(state, { role, content });
  }

  /**
   * Get current session ID for tracking
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get current turn number
   */
  getTurnCounter(): number {
    return this.turnCounter;
  }
}
