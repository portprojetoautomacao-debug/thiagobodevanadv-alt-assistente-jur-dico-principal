declare module '@github/spark/llm' {
  export interface SparkLLM {
    llmPrompt: (strings: TemplateStringsArray | string[], ...values: readonly any[]) => string
    llm: (prompt: string, modelName?: string, jsonMode?: boolean) => Promise<string>
  }

  export const llm: (prompt: string, modelName?: string, jsonMode?: boolean) => Promise<string>
  export const llmPrompt: (strings: TemplateStringsArray | string[], ...values: readonly any[]) => string

  const spark: SparkLLM
  export default spark
}

declare module '@github/spark/spark' {
  export const initialize: () => Promise<void>
}