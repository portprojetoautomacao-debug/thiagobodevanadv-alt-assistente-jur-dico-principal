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
 */

import type { AgentState } from "./agent_state";
import { updateState, addMessage } from "./agent_state";

export interface LangGraphConfig {
  timeoutMs: number;
  maxRetries: number;
  retryDelayMs: number;
}

export const DEFAULT_CONFIG: LangGraphConfig = {
  timeoutMs: 30000, // 30 seconds
  maxRetries: 3,
  retryDelayMs: 1000,
};

export abstract class LangGraphAgent {
  protected config: LangGraphConfig;
  protected abortController: AbortController | null = null;

  constructor(config: Partial<LangGraphConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute the agent with timeout and retry logic
   */
  async execute(state: AgentState): Promise<AgentState> {
    let currentState = state;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        this.abortController = new AbortController();

        const timeoutId = setTimeout(() => {
          this.abortController?.abort();
        }, this.config.timeoutMs);

        const result = await this.run(currentState, this.abortController.signal);

        clearTimeout(timeoutId);
        return result;
      } catch (error) {
        const isLastAttempt = attempt === this.config.maxRetries;

        if (isLastAttempt) {
          return updateState(currentState, {
            error: error instanceof Error ? error.message : "Unknown error",
            completed: true,
          });
        }

        // Exponential backoff
        const delay = this.config.retryDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));

        currentState = updateState(currentState, {
          retryCount: attempt + 1,
        });
      }
    }

    return currentState;
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
}
